-- First, drop existing tables to start fresh
-- Run this BEFORE the create_new_schema.sql

-- Drop existing tables in correct order (dependencies first)
DROP TABLE IF EXISTS public.embeddings CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.dinners CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS match_embeddings CASCADE;

-- Note: We'll keep places table as it's still needed

