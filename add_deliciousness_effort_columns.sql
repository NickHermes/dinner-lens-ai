-- Add deliciousness and effort columns to dinners table
-- Run this in both PRODUCTION and DEVELOPMENT Supabase SQL Editor

-- Add deliciousness column (1-5 stars)
ALTER TABLE public.dinners 
ADD COLUMN IF NOT EXISTS deliciousness INTEGER CHECK (deliciousness >= 1 AND deliciousness <= 5);

-- Add effort column (easy, medium, hard)
ALTER TABLE public.dinners 
ADD COLUMN IF NOT EXISTS effort TEXT CHECK (effort IN ('easy', 'medium', 'hard'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dinners_deliciousness ON public.dinners(deliciousness);
CREATE INDEX IF NOT EXISTS idx_dinners_effort ON public.dinners(effort);
