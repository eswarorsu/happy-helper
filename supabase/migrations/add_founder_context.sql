-- Migration: Add founder_context JSONB column to profiles table
-- This stores the Step 4 "Startup Context" data collected during founder onboarding.
-- Fields stored inside the JSONB object:
--   company_name      TEXT   - Company / Startup name
--   team_size         TEXT   - Number of team members
--   startup_stage     TEXT   - One of: idea | mvp | traction | growth | scaling
--   discovery_source  TEXT   - How the founder heard about INNOVESTOR
--   primary_goal      TEXT   - Founder's primary goal right now
--   biggest_challenge TEXT   - Founder's biggest challenge today
--   decision_timeline TEXT   - How quickly they intend to act
--   funding_status    TEXT   - Current funding status (Bootstrapped, Pre-seed, etc.)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS founder_context JSONB DEFAULT NULL;

COMMENT ON COLUMN public.profiles.founder_context IS
  'JSONB blob storing founder onboarding step-4 startup context data: company_name, team_size, startup_stage, discovery_source, primary_goal, biggest_challenge, decision_timeline, funding_status.';
