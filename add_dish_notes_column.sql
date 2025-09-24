-- Add notes column to dishes table
-- This will complete the data model to match our agreed structure

-- Add the notes column to dishes table
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_dishes_notes ON public.dishes(notes);

-- Update the updated_at timestamp for all existing dishes
UPDATE public.dishes 
SET updated_at = NOW() 
WHERE notes IS NULL;


