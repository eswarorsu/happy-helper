-- =============================================================================
-- INNOVESTOR - PROFIT SHARING TABLE
-- Run this in Supabase SQL Editor
-- Date: 2026-02-06
-- =============================================================================

-- ============================================================================
-- PROFIT SHARES TABLE
-- Tracks profit distributions from founders to investors
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profit_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    investment_record_id UUID REFERENCES public.investment_records(id) ON DELETE SET NULL,
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    
    -- Profit details
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT, -- e.g., "Q1 2026 Revenue Share", "Monthly Dividend"
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profit_shares_chat_request ON public.profit_shares(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_profit_shares_investor ON public.profit_shares(investor_id);
CREATE INDEX IF NOT EXISTS idx_profit_shares_founder ON public.profit_shares(founder_id);
CREATE INDEX IF NOT EXISTS idx_profit_shares_idea ON public.profit_shares(idea_id);
CREATE INDEX IF NOT EXISTS idx_profit_shares_created ON public.profit_shares(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.profit_shares ENABLE ROW LEVEL SECURITY;

-- Users can view profit shares where they are founder or investor
DROP POLICY IF EXISTS "Users can view own profit shares" ON public.profit_shares;
CREATE POLICY "Users can view own profit shares" 
    ON public.profit_shares FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles 
            WHERE id = profit_shares.founder_id OR id = profit_shares.investor_id
        )
    );

-- Only founders can insert profit shares
DROP POLICY IF EXISTS "Founders can insert profit shares" ON public.profit_shares;
CREATE POLICY "Founders can insert profit shares" 
    ON public.profit_shares FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id));

-- ============================================================================
-- Enable Realtime for live updates
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profit_shares;

-- ============================================================================
-- VERIFICATION QUERY (Run after migration)
-- ============================================================================
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profit_shares' AND table_schema = 'public';
