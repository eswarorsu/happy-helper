-- Profit Transactions Table for UPI-based profit sharing
-- This tracks profit payments before investor confirmation

CREATE TABLE IF NOT EXISTS public.profit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_request_id UUID NOT NULL REFERENCES public.chat_requests(id) ON DELETE CASCADE,
    founder_id UUID NOT NULL REFERENCES public.profiles(id),
    investor_id UUID NOT NULL REFERENCES public.profiles(id),
    idea_id UUID NOT NULL REFERENCES public.ideas(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    investor_upi_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'founder_confirmed' CHECK (status IN ('founder_confirmed', 'completed', 'cancelled')),
    description TEXT,
    payment_proof_url TEXT,
    founder_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    investor_confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profit_transactions_chat_request ON public.profit_transactions(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_founder ON public.profit_transactions(founder_id);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_investor ON public.profit_transactions(investor_id);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_status ON public.profit_transactions(status);

-- RLS Policies
ALTER TABLE public.profit_transactions ENABLE ROW LEVEL SECURITY;

-- Founders can create and view their own transactions
CREATE POLICY "Founders can manage their own profit transactions"
    ON public.profit_transactions FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.founder_id))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.founder_id));

-- Investors can view and update their received transactions
CREATE POLICY "Investors can view and confirm their profit transactions"
    ON public.profit_transactions FOR ALL
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.investor_id))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.investor_id));

-- Add upi_id field to profiles if not exists (for investors receiving profit)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'upi_id') THEN
        ALTER TABLE public.profiles ADD COLUMN upi_id TEXT;
    END IF;
END $$;
