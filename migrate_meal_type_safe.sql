-- Safe migration for meal_type: check if column exists first

-- Step 1: Add meal_type column to dishes table (if it doesn't exist)
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'other')) DEFAULT 'dinner';

-- Step 2: Check if meal_type exists in dinner_instances before migrating
DO $$
BEGIN
    -- Check if meal_type column exists in dinner_instances
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dinner_instances' 
        AND column_name = 'meal_type'
        AND table_schema = 'public'
    ) THEN
        -- Migrate existing meal_type data from instances to dishes
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

        -- Remove meal_type column from dinner_instances table
        ALTER TABLE public.dinner_instances 
        DROP COLUMN meal_type;
        
        RAISE NOTICE 'Successfully migrated meal_type from dinner_instances to dishes';
    ELSE
        RAISE NOTICE 'meal_type column does not exist in dinner_instances - migration not needed';
    END IF;
END $$;

-- Step 3: Add index for meal_type on dishes table
CREATE INDEX IF NOT EXISTS idx_dishes_meal_type ON public.dishes(meal_type);

-- Step 4: Verify the result
SELECT 'dishes' as table_name, COUNT(*) as rows_with_meal_type 
FROM public.dishes 
WHERE meal_type IS NOT NULL
UNION ALL
SELECT 'dinner_instances' as table_name, 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'dinner_instances' AND column_name = 'meal_type'
       ) THEN 999999 ELSE 0 END as rows_with_meal_type;


