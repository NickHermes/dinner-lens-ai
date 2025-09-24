-- Clean up the notes field by removing location data that was extracted
-- This will remove the location part (before ' | ') from notes, keeping only the actual notes

UPDATE public.dinner_instances 
SET notes = CASE 
  WHEN notes IS NOT NULL AND notes != '' THEN
    CASE 
      WHEN position(' | ' in notes) > 0 THEN 
        -- Remove the location part (first part before ' | ') and keep the rest
        substring(notes from position(' | ' in notes) + 3)
      ELSE 
        -- If no separator, this was likely all location data, so clear it
        NULL
    END
  ELSE 
    notes  -- Keep as is if already NULL or empty
END
WHERE notes IS NOT NULL AND notes != '';

-- Also clean up consumption_records notes field
UPDATE public.consumption_records 
SET notes = CASE 
  WHEN notes IS NOT NULL AND notes != '' THEN
    CASE 
      WHEN position(' | ' in notes) > 0 THEN 
        -- Remove the location part (first part before ' | ') and keep the rest
        substring(notes from position(' | ' in notes) + 3)
      ELSE 
        -- If no separator, this was likely all location data, so clear it
        NULL
    END
  ELSE 
    notes  -- Keep as is if already NULL or empty
END
WHERE notes IS NOT NULL AND notes != '';

-- Update timestamps for affected rows
UPDATE public.dinner_instances 
SET updated_at = NOW() 
WHERE notes IS NOT NULL;

UPDATE public.consumption_records 
SET updated_at = NOW() 
WHERE notes IS NOT NULL;


