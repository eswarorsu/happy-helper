-- ==========================================
-- HAPPY-HELPER DATABASE RECONSTRUCTION SCRIPT
-- ==========================================
-- This script reconstructs the database schema (tables, types, RLS, triggers)
-- excluding the 'messages' table as requested, but ensuring the 'handle_new_user' trigger exists.

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE public.user_type AS ENUM ('founder', 'investor');
    END IF;
END $$;

-- 2. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. TABLES & COLUMNS (Safe Reconstruction)

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_type user_type NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Safely add potentially missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_job TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_profile TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investment_capital NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interested_domains TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Ideas Table
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,
  investment_needed NUMERIC NOT NULL,
  investment_received NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'funded', 'completed', 'deal_done')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Safely add potentially missing columns to ideas
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS team_size TEXT DEFAULT 'Solopreneur';
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS market_size TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS traction TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Chat Requests Table
CREATE TABLE IF NOT EXISTS public.chat_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'communicating', 'deal_pending_investor', 'deal_done')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Safely add potentially missing columns to chat_requests
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS investor_name TEXT;
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS founder_name TEXT;
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS founder_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_requests ADD COLUMN IF NOT EXISTS investor_pinned BOOLEAN DEFAULT FALSE;

-- Payments Table (Razorpay)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Safely add potentially missing columns to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Investment Records Table
CREATE TABLE IF NOT EXISTS public.investment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES profiles(id) NOT NULL,
  founder_id UUID REFERENCES profiles(id) NOT NULL,
  chat_request_id UUID REFERENCES chat_requests(id),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  payment_method TEXT DEFAULT 'bank_transfer',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRITICAL: USER REGISTRATION TRIGGER (Preserved from Fix)
-- Ensure the function exists and is up to date
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. FUNCTION TRG & CALCULATIONS
-- Update investment_received when record is added/updated/deleted
CREATE OR REPLACE FUNCTION update_idea_investment_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas 
    SET investment_received = COALESCE(investment_received, 0) + NEW.amount
    WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas 
    SET investment_received = COALESCE(investment_received, 0) - OLD.amount
    WHERE id = OLD.idea_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.amount != OLD.amount THEN
    UPDATE ideas 
    SET investment_received = COALESCE(investment_received, 0) - OLD.amount + NEW.amount
    WHERE id = NEW.idea_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up triggers
DO $$ 
BEGIN
    -- profiles updated_at
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    -- ideas updated_at
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ideas_updated_at') THEN
        CREATE TRIGGER update_ideas_updated_at
          BEFORE UPDATE ON public.ideas
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    -- investment synchronization
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_idea_investment') THEN
        CREATE TRIGGER trg_update_idea_investment
          AFTER INSERT OR UPDATE OR DELETE ON investment_records
          FOR EACH ROW EXECUTE FUNCTION update_idea_investment_total();
    END IF;
END $$;


-- 6. ROW LEVEL SECURITY (RLS) policies
-- Re-enable RLS on all tables to be sure
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_records ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;
CREATE POLICY "Authenticated users can view basic profile info" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Note: INSERT is handled by the trigger (Security Definer), but if we want manual inserts:
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Admin Policy (Allows admins to manage all profiles)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (
  (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

-- Ideas Policies
DROP POLICY IF EXISTS "Founders can manage their own ideas" ON public.ideas;
CREATE POLICY "Founders can manage their own ideas" ON public.ideas FOR ALL USING (founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Investors can view all ideas" ON public.ideas;
CREATE POLICY "Investors can view all ideas" ON public.ideas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage all ideas" ON public.ideas;
CREATE POLICY "Admins can manage all ideas" ON public.ideas FOR ALL TO authenticated USING (
  (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

-- Chat Requests Policies
DROP POLICY IF EXISTS "Users can view their own chat requests" ON public.chat_requests;
CREATE POLICY "Users can view their own chat requests" ON public.chat_requests FOR SELECT TO authenticated USING (investor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Investors can create chat requests" ON public.chat_requests;
CREATE POLICY "Investors can create chat requests" ON public.chat_requests FOR INSERT TO authenticated WITH CHECK (investor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Founders can update chat request status" ON public.chat_requests;
CREATE POLICY "Founders can update chat request status" ON public.chat_requests FOR UPDATE TO authenticated USING (founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Payments Policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
CREATE POLICY "Users can update their own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);

-- Investment Records Policies
DROP POLICY IF EXISTS "Founders can view investments in their ideas" ON investment_records;
CREATE POLICY "Founders can view investments in their ideas" ON investment_records FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = founder_id));

DROP POLICY IF EXISTS "Investors can view their investments" ON investment_records;
CREATE POLICY "Investors can view their investments" ON investment_records FOR SELECT USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = investor_id));

DROP POLICY IF EXISTS "Founders can record investments" ON investment_records;
CREATE POLICY "Founders can record investments" ON investment_records FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = founder_id));

DROP POLICY IF EXISTS "Founders can update investments" ON investment_records;
CREATE POLICY "Founders can update investments" ON investment_records FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = founder_id));

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_investment_records_idea ON investment_records(idea_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_investor ON investment_records(investor_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_founder ON investment_records(founder_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_date ON investment_records(transaction_date DESC);
