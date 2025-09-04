-- Fix missing user record for existing auth users
-- This will create user records for any auth.users that don't have corresponding public.users records

INSERT INTO public.users (id, email, display_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu 
  WHERE pu.id = au.id
);
