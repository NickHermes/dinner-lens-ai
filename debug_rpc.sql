-- Debug RPC to check your actual data
-- Run this in Supabase SQL editor to see what's in your tables

CREATE OR REPLACE FUNCTION debug_user_data()
RETURNS TABLE (
  table_name text,
  count bigint,
  sample_data jsonb
) 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  -- Check dinner_instances
  SELECT 'dinner_instances' as table_name, 
         count(*) as count,
         jsonb_agg(
           jsonb_build_object(
             'id', id,
             'dish_id', dish_id,
             'datetime', datetime,
             'variant_title', variant_title,
             'location', location
           )
         ) as sample_data
  FROM (
    SELECT id, dish_id, datetime, variant_title, location
    FROM dinner_instances 
    WHERE user_id = auth.uid()
    ORDER BY datetime DESC 
    LIMIT 3
  ) recent_instances
  
  UNION ALL
  
  -- Check dishes
  SELECT 'dishes' as table_name, 
         count(*) as count,
         jsonb_agg(
           jsonb_build_object(
             'id', id,
             'title', title,
             'health_score', health_score,
             'effort', effort,
             'meal_type', meal_type
           )
         ) as sample_data
  FROM (
    SELECT id, title, health_score, effort, meal_type
    FROM dishes 
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC 
    LIMIT 3
  ) recent_dishes
  
  UNION ALL
  
  -- Check recent dinner_instances (last 30 days)
  SELECT 'recent_instances' as table_name, 
         count(*) as count,
         jsonb_agg(
           jsonb_build_object(
             'id', id,
             'dish_id', dish_id,
             'datetime', datetime,
             'variant_title', variant_title
           )
         ) as sample_data
  FROM (
    SELECT id, dish_id, datetime, variant_title
    FROM dinner_instances 
    WHERE user_id = auth.uid() 
      AND datetime >= now() - interval '30 days'
    ORDER BY datetime DESC 
    LIMIT 5
  ) recent_30_days
  
  UNION ALL
  
  -- Check this month's instances
  SELECT 'this_month_instances' as table_name, 
         count(*) as count,
         jsonb_agg(
           jsonb_build_object(
             'id', id,
             'dish_id', dish_id,
             'datetime', datetime,
             'variant_title', variant_title
           )
         ) as sample_data
  FROM (
    SELECT id, dish_id, datetime, variant_title
    FROM dinner_instances 
    WHERE user_id = auth.uid() 
      AND datetime >= date_trunc('month', now())
      AND datetime < date_trunc('month', now()) + interval '1 month'
    ORDER BY datetime DESC 
    LIMIT 5
  ) this_month;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION debug_user_data TO authenticated;
