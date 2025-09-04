-- Apply this to your DEVELOPMENT Supabase database
-- Go to: https://supabase.com/dashboard/project/bvzclxdppwpayawrnrkz
-- Then go to SQL Editor and run this script

-- First, let's see what's already there
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- If you need to start fresh, uncomment the next line:
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;

-- Then run your full schema.sql file
