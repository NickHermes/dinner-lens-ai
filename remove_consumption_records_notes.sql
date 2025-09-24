-- Remove notes column from consumption_records table
-- Instance level should only have date and location according to our data model

-- Drop the notes column from consumption_records
ALTER TABLE public.consumption_records 
DROP COLUMN IF EXISTS notes;

-- Update timestamps for all affected rows
UPDATE public.consumption_records 
SET updated_at = NOW();


