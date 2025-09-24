-- Add location column to dinner_instances table
-- This will separate location from notes properly

-- Add the location column
ALTER TABLE public.dinner_instances 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Migrate existing data: extract location from notes field
-- Location is typically the first part before ' | ' separator
UPDATE public.dinner_instances 
SET location = CASE 
  WHEN notes IS NOT NULL AND notes != '' THEN
    CASE 
      WHEN position(' | ' in notes) > 0 THEN 
        split_part(notes, ' | ', 1)
      ELSE 
        notes  -- If no separator, treat entire notes as location
    END
  ELSE 
    NULL
END
WHERE location IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_dinner_instances_location ON public.dinner_instances(location);

-- Update the updated_at timestamp for all affected rows
UPDATE public.dinner_instances 
SET updated_at = NOW() 
WHERE location IS NOT NULL;


