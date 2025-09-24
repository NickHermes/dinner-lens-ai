-- Add variant title column to dinner_instances table
-- This will allow users to distinguish between different variants of the same dish

-- Add the variant_title column
ALTER TABLE public.dinner_instances 
ADD COLUMN IF NOT EXISTS variant_title TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_dinner_instances_variant_title ON public.dinner_instances(variant_title);

-- Update the updated_at timestamp for all existing rows
UPDATE public.dinner_instances 
SET updated_at = NOW() 
WHERE variant_title IS NULL;


