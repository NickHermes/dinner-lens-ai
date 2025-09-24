-- Move meal_type from dinner_instances to dishes table
-- Step 1: Add meal_type column to dishes table
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'other')) DEFAULT 'dinner';

-- Step 2: Migrate existing meal_type data from instances to dishes
-- For each dish, take the most common meal_type from its instances
UPDATE public.dishes 
SET meal_type = subquery.most_common_meal_type
FROM (
  SELECT 
    dish_id,
    meal_type as most_common_meal_type
  FROM (
    SELECT 
      dish_id,
      meal_type,
      COUNT(*) as meal_type_count,
      ROW_NUMBER() OVER (PARTITION BY dish_id ORDER BY COUNT(*) DESC, meal_type ASC) as rn
    FROM public.dinner_instances 
    WHERE meal_type IS NOT NULL
    GROUP BY dish_id, meal_type
  ) ranked_meal_types
  WHERE rn = 1
) subquery
WHERE dishes.id = subquery.dish_id;

-- Step 3: Remove meal_type column from dinner_instances table
ALTER TABLE public.dinner_instances 
DROP COLUMN IF EXISTS meal_type;

-- Add index for meal_type on dishes table
CREATE INDEX IF NOT EXISTS idx_dishes_meal_type ON public.dishes(meal_type);


