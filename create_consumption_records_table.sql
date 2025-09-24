-- Create consumption_records table to track individual consumption events
-- This replaces the count/last_consumed approach with individual records

CREATE TABLE IF NOT EXISTS public.consumption_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.dinner_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_consumption_records_instance_id ON public.consumption_records(instance_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON public.consumption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_consumed_at ON public.consumption_records(consumed_at);

-- Enable RLS
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own consumption records" ON public.consumption_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumption records" ON public.consumption_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumption records" ON public.consumption_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consumption records" ON public.consumption_records
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consumption_records_updated_at 
  BEFORE UPDATE ON public.consumption_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


