-- Add meal_type column to dinners table
ALTER TABLE public.dinners 
ADD COLUMN meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'other')) DEFAULT 'dinner';

-- Add index for meal_type for better query performance
CREATE INDEX idx_dinners_meal_type ON public.dinners(meal_type);

-- Update existing records to have 'dinner' as default meal_type
UPDATE public.dinners SET meal_type = 'dinner' WHERE meal_type IS NULL;
