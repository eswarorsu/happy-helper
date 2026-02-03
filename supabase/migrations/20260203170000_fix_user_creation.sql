-- Migration to fix user creation trigger
-- This ensures that when a new user signs up via Supabase Auth,
-- a corresponding profile is created in the public.profiles table.

-- 1. Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_user_type user_type;
BEGIN
  -- Determine user type (default to 'founder' if not specified or invalid)
  BEGIN
    new_user_type := (new.raw_user_meta_data->>'user_type')::user_type;
  EXCEPTION WHEN OTHERS THEN
    new_user_type := 'founder'::user_type;
  END;

  INSERT INTO public.profiles (
    user_id,
    email,
    name,
    user_type,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    new_user_type,
    new.raw_user_meta_data->>'phone',
    now(),
    now()
  );

  RETURN new;
END;
$$;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
