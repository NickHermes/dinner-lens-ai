-- Fixed RPC to use consumption_records for meal count
-- Run this in Supabase SQL editor to replace the get_kpis function

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
    select cr.*, di.dish_id, di.datetime, d.health_score, d.effort
    from consumption_records cr
    join dinner_instances di on di.id = cr.instance_id
    join dishes d on d.id = di.dish_id
    where cr.user_id = auth.uid() 
      and cr.consumed_at >= p_start 
      and cr.consumed_at < p_end
  ),
  counts as (
    select
      count(*) total_meals,
      count(distinct dish_id) unique_dishes,
      count(distinct instance_id) unique_variants
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

-- Grant permission
GRANT EXECUTE ON FUNCTION get_kpis TO authenticated;
