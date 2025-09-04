-- Enable vector extension in development Supabase
-- Run this in the SQL Editor of your development Supabase project

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
