-- Move effort from dinner_instances to dishes table
-- Step 1: Add effort column to dishes table
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS effort TEXT CHECK (effort IN ('easy', 'medium', 'hard'));

-- Step 2: Migrate existing effort data from instances to dishes
-- For each dish, take the most common effort level from its instances
UPDATE public.dishes 
SET effort = subquery.most_common_effort
FROM (
  SELECT 
    dish_id,
    effort as most_common_effort
  FROM (
    SELECT 
      dish_id,
      effort,
      COUNT(*) as effort_count,
      ROW_NUMBER() OVER (PARTITION BY dish_id ORDER BY COUNT(*) DESC, effort ASC) as rn
    FROM public.dinner_instances 
    WHERE effort IS NOT NULL
    GROUP BY dish_id, effort
  ) ranked_efforts
  WHERE rn = 1
) subquery
WHERE dishes.id = subquery.dish_id;

-- Step 3: Remove effort column from dinner_instances table
ALTER TABLE public.dinner_instances 
DROP COLUMN IF EXISTS effort;

-- Add index for effort on dishes table
CREATE INDEX IF NOT EXISTS idx_dishes_effort ON public.dishes(effort);


