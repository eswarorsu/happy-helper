-- Fix profiles RLS policy for INSERT
-- The issue is that the INSERT policy is checking auth.uid() = user_id
-- but this can fail if the session isn't fully established

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate with a more robust check
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  -- The user_id being inserted must match the authenticated user's ID
  user_id = auth.uid()
);

-- Also allow upsert/update properly
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
