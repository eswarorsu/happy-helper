-- Migration: Add Marketplace and Deal Tracking Fields
-- Date: 2026-02-03

-- ============================================================================
-- PART 1: Ideas Table - Marketplace Fields
-- ============================================================================

-- Add founder location (city-level only for filtering)
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS founder_city TEXT;

-- Add founder phone (NEVER exposed to investors, admin/support use only)
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS founder_phone TEXT;

-- Add work mode for filtering
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS work_mode TEXT CHECK (work_mode IS NULL OR work_mode IN ('online', 'offline', 'hybrid'));

-- ============================================================================
-- PART 2: Chat Requests Table - Deal Tracking Fields
-- ============================================================================

-- Add proposed deal amount
ALTER TABLE public.chat_requests 
ADD COLUMN IF NOT EXISTS proposed_amount DECIMAL(15, 2);

-- Add deal status for tracking the deal workflow
ALTER TABLE public.chat_requests 
ADD COLUMN IF NOT EXISTS deal_status TEXT DEFAULT 'none' CHECK (deal_status IN ('none', 'proposed', 'accepted', 'rejected', 'payment_pending', 'completed'));

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ideas_founder_city ON public.ideas(founder_city);
CREATE INDEX IF NOT EXISTS idx_ideas_work_mode ON public.ideas(work_mode);
CREATE INDEX IF NOT EXISTS idx_chat_requests_deal_status ON public.chat_requests(deal_status);
