-- Fix RLS Infinite Recursion
-- Problem: The policy "Admins can manage all profiles" queries the "profiles" table to check is_admin.
-- Querying "profiles" triggers the policy again -> Infinite Recursion.
-- Fix: Use a SECURITY DEFINER function to bypass RLS for the admin check.

-- 1. Create the helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/supabase_admin), bypassing RLS
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  );
END;
$$;

-- 2. Update Profiles Policies to use the function
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING ( public.is_admin() );

-- 3. Update Ideas Policies to use the function
DROP POLICY IF EXISTS "Admins can manage all ideas" ON public.ideas;

CREATE POLICY "Admins can manage all ideas" 
ON public.ideas 
FOR ALL 
TO authenticated 
USING ( public.is_admin() );

-- 4. Ensure RLS is enabled (safety check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
