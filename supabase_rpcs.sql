-- Supabase RPCs for Insights and Inspiration features
-- Run these in your Supabase SQL editor

-- ===== INSIGHTS RPCs =====

-- 1. Get KPIs for a time range
CREATE OR REPLACE FUNCTION get_kpis(p_start timestamptz, p_end timestamptz)
RETURNS TABLE (
  total_meals int,
  unique_dishes int,
  unique_variants int,
  new_ratio numeric,
  avg_health numeric,
  avg_effort text
) 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  with f as (
    select di.*, d.health_score, d.effort
    from dinner_instances di
    join dishes d on d.id = di.dish_id
    where di.user_id = auth.uid() 
      and di.datetime >= p_start 
      and di.datetime < p_end
  ),
  counts as (
    select
      count(*) total_meals,
      count(distinct dish_id) unique_dishes,
      count(distinct id) unique_variants
    from f
  ),
  flags as (
    select
      avg((case when cnt = 1 then 1 else 0 end)::numeric) new_ratio
    from (
      select dish_id, count(*) cnt from f group by dish_id
    ) s
  ),
  metrics as (
    select avg(health_score)::numeric avg_health,
           mode() within group (order by effort) as avg_effort
    from f
  )
  select counts.total_meals, counts.unique_dishes, counts.unique_variants,
         coalesce(flags.new_ratio, 0), metrics.avg_health, metrics.avg_effort
  from counts, flags, metrics;
$$;

-- 2. Get top tags/ingredients for a time range
CREATE OR REPLACE FUNCTION get_top_tags(p_start timestamptz, p_end timestamptz, p_limit int default 20)
RETURNS TABLE (tag text, freq int) 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  with f as (
    select di.id as instance_id
    from dinner_instances di
    where di.user_id = auth.uid() 
      and di.datetime >= p_start 
      and di.datetime < p_end
  ),
  exploded as (
    select t.name as tag
    from tags t
    join f on f.instance_id = t.instance_id
    where t.approved = true
    union all
    select t.name as tag
    from tags t
    join f on f.instance_id = (
      select di.id from dinner_instances di 
      where di.dish_id = t.dish_id and di.user_id = auth.uid()
      limit 1
    )
    where t.is_base_tag = true and t.approved = true
  )
  select tag, count(*) as freq
  from exploded
  group by tag
  order by freq desc
  limit p_limit;
$$;

-- 3. Get health/effort trends over time
CREATE OR REPLACE FUNCTION get_trends(p_start timestamptz, p_end timestamptz, p_bucket text default 'day')
RETURNS TABLE (bucket_date date, avg_health numeric, effort_mode text, meals int)
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  with f as (
    select di.datetime, d.health_score, d.effort
    from dinner_instances di
    join dishes d on d.id = di.dish_id
    where di.user_id = auth.uid() 
      and di.datetime >= p_start 
      and di.datetime < p_end
  )
  select date_trunc(p_bucket, datetime)::date as bucket_date,
         avg(health_score)::numeric as avg_health,
         mode() within group (order by effort) as effort_mode,
         count(*) as meals
  from f
  group by 1
  order by 1;
$$;

-- 4. Get repeat cadence analysis
CREATE OR REPLACE FUNCTION get_repeat_cadence(p_start timestamptz, p_end timestamptz, p_limit int default 20)
RETURNS TABLE (dish_id uuid, dish_title text, median_gap_days numeric, last_eaten timestamptz, due boolean)
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
begin
  return query
  with f as (
    select di.dish_id, d.title as dish_title, di.datetime
    from dinner_instances di
    join dishes d on d.id = di.dish_id
    where di.user_id = auth.uid() and di.datetime >= p_start and di.datetime < p_end
    order by di.dish_id, di.datetime
  ),
  gaps as (
    select dish_id, dish_title, 
           datetime - lag(datetime) over (partition by dish_id order by datetime) as gap, 
           datetime as last_eaten
    from f
  ),
  agg as (
    select dish_id, max(dish_title) dish_title,
           percentile_cont(0.5) within group (order by extract(epoch from gap)/86400) as median_gap_days,
           max(last_eaten) as last_eaten
    from gaps
    where gap is not null
    group by dish_id
  )
  select dish_id, dish_title, median_gap_days, last_eaten,
         (now() - last_eaten) > (median_gap_days * interval '1 day') as due
  from agg
  order by due desc, last_eaten asc
  limit p_limit;
end; 
$$;

-- ===== INSPIRATION RPCs =====

-- 5. Get cooldown suggestions (dishes not eaten recently)
CREATE OR REPLACE FUNCTION get_cooldown_suggestions(
  p_cooldown_days int default 14, 
  p_limit int default 20,
  p_meal_type text default null, 
  p_min_health int default null, 
  p_max_effort text default null
)
RETURNS TABLE (dish_id uuid, dish_title text, last_eaten timestamptz, times_90d int)
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  with last as (
    select dish_id, max(datetime) last_eaten
    from dinner_instances 
    where user_id = auth.uid()
    group by dish_id
  ),
  recent as (
    select d.*
    from dishes d
    where d.user_id = auth.uid()
      and (p_meal_type is null or d.meal_type = p_meal_type)
      and (p_min_health is null or d.health_score >= p_min_health)
      and (p_max_effort is null or d.effort <= p_max_effort)
  ),
  counts as (
    select dish_id, count(*) filter (where datetime >= now() - interval '90 days') as times_90d
    from dinner_instances di
    where di.user_id = auth.uid()
    group by dish_id
  )
  select l.dish_id, r.title as dish_title, l.last_eaten, coalesce(c.times_90d,0) as times_90d
  from last l
  join recent r on r.id = l.dish_id
  left join counts c on c.dish_id = l.dish_id
  where coalesce(l.last_eaten, timestamp 'epoch') <= now() - (p_cooldown_days || ' days')::interval
  order by l.last_eaten nulls first, c.times_90d asc
  limit p_limit;
$$;

-- 6. Get dish of the day (deterministic scoring)
CREATE OR REPLACE FUNCTION get_dish_of_day(p_date date default current_date, p_cooldown_days int default 14, p_top_k int default 5)
RETURNS TABLE (dish_id uuid, dish_title text, top_variant text, last_eaten timestamptz, score numeric)
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
begin
  return query
  with candidates as (
    select d.id as dish_id, d.title as dish_title, d.health_score,
           max(di.datetime) as last_eaten,
           count(*) filter (where di.datetime >= now() - interval '90 days') as times_90d,
           -- Recency score (higher = more recent)
           case 
             when max(di.datetime) is null then 1.0
             else least(1.0, extract(epoch from (now() - max(di.datetime))) / (p_cooldown_days * 86400))
           end as recency_score,
           -- Diversity score (lower = more diverse)
           1.0 / (1.0 + count(*) filter (where di.datetime >= now() - interval '90 days')) as diversity_score,
           -- Weekday affinity (if eaten on same weekday before)
           case 
             when count(*) filter (where extract(dow from di.datetime) = extract(dow from p_date::timestamp)) > 0 
             then 0.8 else 0.5 
           end as weekday_affinity
    from dishes d
    left join dinner_instances di on di.dish_id = d.id and di.user_id = auth.uid()
    where d.user_id = auth.uid()
    group by d.id, d.title, d.health_score
  ),
  scored as (
    select dish_id, dish_title, last_eaten, times_90d,
           -- Final score: weighted combination
           0.4 * recency_score + 0.3 * diversity_score + 0.3 * weekday_affinity as final_score
    from candidates
    where last_eaten is null or last_eaten <= now() - (p_cooldown_days || ' days')::interval
  ),
  ranked as (
    select dish_id, dish_title, last_eaten, times_90d, final_score,
           row_number() over (order by final_score desc) as rn
    from scored
  ),
  top_k as (
    select dish_id, dish_title, last_eaten, times_90d, final_score
    from ranked
    where rn <= p_top_k
  ),
  -- Deterministic selection based on date + user
  selected as (
    select *, 
           abs(hashtext(auth.uid()::text || p_date::text || dish_id::text)) % p_top_k as hash_rank
    from top_k
  )
  select s.dish_id, s.dish_title, 
         (select variant_title from dinner_instances di 
          where di.dish_id = s.dish_id and di.user_id = auth.uid() 
          order by di.datetime desc limit 1) as top_variant,
         s.last_eaten, s.final_score
  from selected s
  where s.hash_rank = (
    select min(hash_rank) from selected
  )
  limit 1;
end; 
$$;

-- ===== OPTIONAL: Daily recommendations cache table =====
CREATE TABLE IF NOT EXISTS daily_recommendations (
  user_id uuid NOT NULL,
  day date NOT NULL,
  dish_id uuid NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  manual_override boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, day)
);

-- RLS for daily_recommendations
ALTER TABLE daily_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own daily recommendations" ON daily_recommendations
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== GRANT PERMISSIONS =====
-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_kpis TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_tags TO authenticated;
GRANT EXECUTE ON FUNCTION get_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_repeat_cadence TO authenticated;
GRANT EXECUTE ON FUNCTION get_cooldown_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION get_dish_of_day TO authenticated;
