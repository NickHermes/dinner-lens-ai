-- ============================================
-- FIX TAG INHERITANCE FOR ANALYTICS
-- ============================================
-- This fixes the issue where base tags from dishes weren't being
-- inherited when creating new variants or logging dishes again.
-- 
-- Run this in your Supabase SQL Editor
-- ============================================

-- Get top cuisines for a time range (counts consumption records)
-- FIXED: Added user_id checks to ensure proper tag filtering and inheritance
CREATE OR REPLACE FUNCTION public.get_top_cuisines(
  p_start timestamptz,
  p_end timestamptz,
  p_limit int default 10
)
RETURNS TABLE (cuisine text, freq int)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with records as (
    select
      cr.id as record_id,
      cr.instance_id,
      cr.consumed_at,
      di.dish_id,
      di.user_id
    from consumption_records cr
    join dinner_instances di on di.id = cr.instance_id
    where cr.user_id = auth.uid()
      and di.user_id = auth.uid()
      and cr.consumed_at >= p_start
      and cr.consumed_at < p_end
  ),
  instance_cuisines as (
    select
      t.instance_id,
      min(match_cuisine(t.name)) as cuisine
    from tags t
    join dinner_instances di on di.id = t.instance_id
    where t.approved = true
      and di.user_id = auth.uid()
      and match_cuisine(t.name) is not null
    group by t.instance_id
  ),
  dish_cuisines as (
    select
      t.dish_id,
      min(match_cuisine(t.name)) as cuisine
    from tags t
    join dishes d on d.id = t.dish_id
    where t.is_base_tag = true
      and t.approved = true
      and d.user_id = auth.uid()
      and match_cuisine(t.name) is not null
    group by t.dish_id
  ),
  record_cuisine as (
    select
      r.record_id,
      coalesce(ic.cuisine, dc.cuisine) as cuisine
    from records r
    left join instance_cuisines ic on ic.instance_id = r.instance_id
    left join dish_cuisines dc on dc.dish_id = r.dish_id
  )
  select cuisine, count(*)::int as freq
  from record_cuisine
  where cuisine is not null
  group by cuisine
  order by freq desc
  limit p_limit;
$$;

-- Get top tags/ingredients for a time range (excludes cuisine tags, counts consumption records)
-- FIXED: Added user_id checks to ensure proper tag filtering and inheritance
CREATE OR REPLACE FUNCTION public.get_top_tags(p_start timestamptz, p_end timestamptz, p_limit int default 20)
RETURNS TABLE (tag text, freq int)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with records as (
    select cr.id as record_id, cr.instance_id, di.dish_id, di.user_id
    from consumption_records cr
    join dinner_instances di on di.id = cr.instance_id
    where cr.user_id = auth.uid()
      and di.user_id = auth.uid()
      and cr.consumed_at >= p_start
      and cr.consumed_at < p_end
  ),
  instance_tags as (
    select r.record_id, t.name as tag
    from records r
    join tags t on t.instance_id = r.instance_id
    join dinner_instances di on di.id = t.instance_id
    where t.approved = true
      and di.user_id = auth.uid()
      and t.type != 'cuisine'
      and match_cuisine(t.name) is null
  ),
  dish_tags as (
    select r.record_id, t.name as tag
    from records r
    join tags t on t.dish_id = r.dish_id
    join dishes d on d.id = t.dish_id
    where t.is_base_tag = true
      and t.approved = true
      and d.user_id = auth.uid()
      and t.type != 'cuisine'
      and match_cuisine(t.name) is null
  ),
  all_tags as (
    select tag from instance_tags
    union all
    select tag from dish_tags
  )
  select tag, count(*)::int as freq
  from all_tags
  group by tag
  order by freq desc
  limit p_limit;
$$;

-- Grant permissions (if not already granted)
GRANT EXECUTE ON FUNCTION public.get_top_cuisines TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_tags TO authenticated;

