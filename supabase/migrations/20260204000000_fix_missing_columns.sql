-- =============================================================================
-- INNOVESTOR - COMPLETE DATABASE FIX MIGRATION
-- Run this in Supabase SQL Editor (https://wxnxmglyularlfughmen.supabase.co)
-- Date: 2026-02-04
-- =============================================================================

-- ============================================================================
-- PART 1: Chat Requests Table - Deal Tracking Fields
-- ============================================================================

-- Add proposed deal amount (if not exists)
ALTER TABLE public.chat_requests 
ADD COLUMN IF NOT EXISTS proposed_amount DECIMAL(15, 2);

-- Add deal status (if not exists)
ALTER TABLE public.chat_requests 
ADD COLUMN IF NOT EXISTS deal_status TEXT DEFAULT 'none';

-- Fix deal_status constraint to include 'requested' for reinvestment flow
ALTER TABLE public.chat_requests 
DROP CONSTRAINT IF EXISTS chat_requests_deal_status_check;

ALTER TABLE public.chat_requests 
ADD CONSTRAINT chat_requests_deal_status_check 
CHECK (deal_status IS NULL OR deal_status IN ('none', 'proposed', 'accepted', 'rejected', 'requested', 'payment_pending', 'completed'));

-- ============================================================================
-- PART 2: Ideas Table - Marketplace Fields
-- ============================================================================

ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS founder_city TEXT;

ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS founder_phone TEXT;

ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS work_mode TEXT;

-- Fix work_mode constraint
ALTER TABLE public.ideas 
DROP CONSTRAINT IF EXISTS ideas_work_mode_check;

ALTER TABLE public.ideas 
ADD CONSTRAINT ideas_work_mode_check 
CHECK (work_mode IS NULL OR work_mode IN ('online', 'offline', 'hybrid'));

-- ============================================================================
-- PART 3: Investment Records - RLS Policies
-- ============================================================================

-- Allow users to view their own investments
DROP POLICY IF EXISTS "Users can view own investments" ON public.investment_records;
CREATE POLICY "Users can view own investments" 
    ON public.investment_records FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- Allow founders AND investors to insert investment records
DROP POLICY IF EXISTS "Users can insert investment records" ON public.investment_records;
CREATE POLICY "Users can insert investment records" 
    ON public.investment_records FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- Allow updates to investment records by participants
DROP POLICY IF EXISTS "Users can update investment records" ON public.investment_records;
CREATE POLICY "Users can update investment records" 
    ON public.investment_records FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- ============================================================================
-- PART 4: Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ideas_founder_city ON public.ideas(founder_city);
CREATE INDEX IF NOT EXISTS idx_ideas_work_mode ON public.ideas(work_mode);
CREATE INDEX IF NOT EXISTS idx_chat_requests_deal_status ON public.chat_requests(deal_status);
CREATE INDEX IF NOT EXISTS idx_investment_records_idea ON public.investment_records(idea_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_investor ON public.investment_records(investor_id);

-- ============================================================================
-- PART 5: Enable Realtime for Tables
-- ============================================================================

-- Enable realtime on investment_records (required for live dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.investment_records;

-- ============================================================================
-- PART 6: SYNC EXISTING INVESTMENTS (CRITICAL!)
-- This updates ideas.investment_received from actual investment_records
-- ============================================================================

UPDATE public.ideas 
SET investment_received = COALESCE(
  (SELECT SUM(amount) FROM public.investment_records WHERE investment_records.idea_id = ideas.id),
  0
);

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- Check chat_requests columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'chat_requests' AND table_schema = 'public';

-- Check if investment_received is synced
-- SELECT id, title, investment_received FROM ideas WHERE investment_received > 0;

-- Check investment records
-- SELECT * FROM investment_records ORDER BY created_at DESC LIMIT 5;

