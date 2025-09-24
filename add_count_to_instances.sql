-- Add count column to dinner_instances to track how many times this specific variant was consumed
ALTER TABLE public.dinner_instances 
ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 1 NOT NULL;

-- Add last_consumed column to track the most recent time this variant was had
ALTER TABLE public.dinner_instances 
ADD COLUMN IF NOT EXISTS last_consumed TIMESTAMP WITH TIME ZONE;

-- Update existing data: set last_consumed = datetime for existing records
UPDATE public.dinner_instances 
SET last_consumed = datetime 
WHERE last_consumed IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_dinner_instances_count ON public.dinner_instances(count);
CREATE INDEX IF NOT EXISTS idx_dinner_instances_last_consumed ON public.dinner_instances(last_consumed);


