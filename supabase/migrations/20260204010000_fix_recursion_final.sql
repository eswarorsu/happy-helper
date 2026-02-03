-- Final Fix for RLS Infinite Recursion
-- Strategy: Use a separate 'admin_list' table to break the circular dependency.
-- profiles -> triggers -> admin_list
-- policies -> is_admin() -> admin_list

-- 1. Create the Admin List Table
CREATE TABLE IF NOT EXISTS public.admin_list (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (but allow reading for authenticated via helper)
ALTER TABLE public.admin_list ENABLE ROW LEVEL SECURITY;

-- 2. Sync Trigger Function
CREATE OR REPLACE FUNCTION public.sync_admin_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.is_admin = true THEN
        INSERT INTO public.admin_list (user_id)
        VALUES (NEW.user_id)
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        DELETE FROM public.admin_list WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Trigger on Profiles
DROP TRIGGER IF EXISTS trg_sync_admin_status ON public.profiles;
CREATE TRIGGER trg_sync_admin_status
    AFTER INSERT OR UPDATE OF is_admin
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_admin_status();

-- 4. Initial Sync (Populate existing admins)
INSERT INTO public.admin_list (user_id)
SELECT user_id FROM public.profiles WHERE is_admin = true
ON CONFLICT (user_id) DO NOTHING;

-- 5. Update is_admin() to use the new table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_list WHERE user_id = auth.uid()
    );
END;
$$;

-- 6. Ensure Policies use the function (Refresh)
-- Profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Ideas
DROP POLICY IF EXISTS "Admins can manage all ideas" ON public.ideas;
CREATE POLICY "Admins can manage all ideas" ON public.ideas FOR ALL TO authenticated USING (public.is_admin());

-- Admin List Policy (Internal use mostly, but good practice)
DROP POLICY IF EXISTS "Everyone can read admin list" ON public.admin_list;
-- Actually, only we need to read it via the function.
-- But let's allow read for referencing just in case, or keep it strict.
-- Since is_admin() is SECURITY DEFINER, we don't strictly need a policy here for auth users.
