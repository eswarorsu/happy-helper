
-- 1. Add UPI columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS upi_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT;

-- 2. Create UPI transactions table
CREATE TABLE IF NOT EXISTS public.upi_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    investment_record_id UUID REFERENCES public.investment_records(id) ON DELETE SET NULL,
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment details
    amount NUMERIC NOT NULL CHECK (amount > 0),
    founder_upi_id TEXT NOT NULL,
    
    -- UPI transaction reference (if provided)
    upi_transaction_ref TEXT,
    
    -- Status: 'initiated' -> 'investor_confirmed' -> 'founder_confirmed' -> 'completed' OR 'disputed'
    status TEXT DEFAULT 'initiated',
    
    -- Confirmations
    investor_confirmed_at TIMESTAMP WITH TIME ZONE,
    founder_confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Proof
    payment_proof_url TEXT, -- Screenshot upload
    
    -- Dispute handling
    disputed BOOLEAN DEFAULT false,
    dispute_reason TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_upi_transactions_investor ON public.upi_transactions(investor_id);
CREATE INDEX IF NOT EXISTS idx_upi_transactions_founder ON public.upi_transactions(founder_id);
CREATE INDEX IF NOT EXISTS idx_upi_transactions_status ON public.upi_transactions(status);

-- 4. Enable RLS
ALTER TABLE public.upi_transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.upi_transactions;
CREATE POLICY "Users can view own transactions" 
    ON public.upi_transactions FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles 
            WHERE id = upi_transactions.founder_id OR id = upi_transactions.investor_id
        )
    );

DROP POLICY IF EXISTS "Investors can initiate transactions" ON public.upi_transactions;
CREATE POLICY "Investors can initiate transactions" 
    ON public.upi_transactions FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = investor_id));

DROP POLICY IF EXISTS "Users can update own transactions" ON public.upi_transactions;
CREATE POLICY "Users can update own transactions" 
    ON public.upi_transactions FOR UPDATE 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles 
            WHERE id = upi_transactions.founder_id OR id = upi_transactions.investor_id
        )
    );

-- 6. Grant permissions
GRANT ALL ON public.upi_transactions TO authenticated;
GRANT ALL ON public.upi_transactions TO service_role;
