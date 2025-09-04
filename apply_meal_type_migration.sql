-- Apply this to both your PRODUCTION and DEVELOPMENT Supabase databases
-- Production: https://supabase.com/dashboard/project/ijhmecfayyndnhmfuzll
-- Development: https://supabase.com/dashboard/project/bvzclxdppwpayawrnrkz

-- Add meal_type column to dinners table
ALTER TABLE public.dinners 
ADD COLUMN IF NOT EXISTS meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'other')) DEFAULT 'dinner';

-- Add index for meal_type for better query performance
CREATE INDEX IF NOT EXISTS idx_dinners_meal_type ON public.dinners(meal_type);

-- Update existing records to have 'dinner' as default meal_type
UPDATE public.dinners SET meal_type = 'dinner' WHERE meal_type IS NULL;
