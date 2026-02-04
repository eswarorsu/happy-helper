-- =============================================================================
-- INNOVESTOR - INVESTOR PROFILE ENHANCEMENT MIGRATION
-- Run this in Supabase SQL Editor
-- Date: 2026-02-04
-- =============================================================================

-- ============================================================================
-- PART 1: Add New Investor Profile Fields
-- ============================================================================

-- Personal Identity
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nationality TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Professional Background
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS investor_type TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS investing_experience INTEGER; -- in years

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_designation TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_profile TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professional_bio TEXT;

-- Investment Profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS investment_range TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_stage TEXT[];

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS previous_investments TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roi_timeline TEXT;

-- Verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pan_last4 TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_accredited BOOLEAN DEFAULT false;

-- ============================================================================
-- PART 2: Add Constraints for Data Integrity
-- ============================================================================

-- Drop existing constraints if they exist (for re-run safety)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_investor_type_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_investment_range_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_roi_timeline_check;

-- Investor Type Constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_investor_type_check 
CHECK (investor_type IS NULL OR investor_type IN ('angel', 'vc', 'individual', 'family_office', 'hni'));

-- Investment Range Constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_investment_range_check 
CHECK (investment_range IS NULL OR investment_range IN ('1L-10L', '10L-50L', '50L-1Cr', '1Cr-5Cr', '5Cr+'));

-- ROI Timeline Constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_roi_timeline_check 
CHECK (roi_timeline IS NULL OR roi_timeline IN ('1-3years', '3-5years', '5+years'));

-- ============================================================================
-- PART 3: Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_investor_type ON public.profiles(investor_type);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_investment_range ON public.profiles(investment_range);

-- ============================================================================
-- VERIFICATION QUERY (Run after migration)
-- ============================================================================

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND table_schema = 'public'
-- ORDER BY ordinal_position;
