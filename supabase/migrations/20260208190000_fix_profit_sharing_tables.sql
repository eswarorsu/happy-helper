-- Comprehensive migration for Profit Sharing features (SAFE TO RUN REPEATEDLY)

-- 1. Create profit_transactions table if it doesn't exist
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

-- Indexes for profit_transactions
CREATE INDEX IF NOT EXISTS idx_profit_transactions_chat_request ON public.profit_transactions(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_founder ON public.profit_transactions(founder_id);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_investor ON public.profit_transactions(investor_id);

-- RLS for profit_transactions
ALTER TABLE public.profit_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profit_transactions' AND policyname = 'Founders can manage their own profit transactions') THEN
        CREATE POLICY "Founders can manage their own profit transactions"
            ON public.profit_transactions FOR ALL
            USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.founder_id))
            WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.founder_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profit_transactions' AND policyname = 'Investors can view and confirm their profit transactions') THEN
        CREATE POLICY "Investors can view and confirm their profit transactions"
            ON public.profit_transactions FOR ALL
            USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.investor_id))
            WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_transactions.investor_id));
    END IF;
END $$;


-- 2. Create profit_shares table (Official Ledger) if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profit_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE,
    founder_id UUID REFERENCES public.profiles(id),
    investor_id UUID REFERENCES public.profiles(id),
    idea_id UUID REFERENCES public.ideas(id),
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    payment_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure payment_proof_url column exists in profit_shares (if table already existed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profit_shares' AND column_name = 'payment_proof_url') THEN
        ALTER TABLE public.profit_shares ADD COLUMN payment_proof_url TEXT;
    END IF;
    -- Also ensure it exists in profit_transactions just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profit_transactions' AND column_name = 'payment_proof_url') THEN
        ALTER TABLE public.profit_transactions ADD COLUMN payment_proof_url TEXT;
    END IF;
END $$;

-- Indexes for profit_shares
CREATE INDEX IF NOT EXISTS idx_profit_shares_investor ON public.profit_shares(investor_id);
CREATE INDEX IF NOT EXISTS idx_profit_shares_founder ON public.profit_shares(founder_id);

-- RLS for profit_shares
ALTER TABLE public.profit_shares ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profit_shares' AND policyname = 'Users can view profit shares they are involved in') THEN
        CREATE POLICY "Users can view profit shares they are involved in"
            ON public.profit_shares FOR SELECT
            USING (
                auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_shares.founder_id) OR
                auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_shares.investor_id)
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profit_shares' AND policyname = 'Users can insert profit shares if involved') THEN
        CREATE POLICY "Users can insert profit shares if involved"
            ON public.profit_shares FOR INSERT
            WITH CHECK (
                auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_shares.founder_id) OR
                auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profit_shares.investor_id)
            );
    END IF;
END $$;

-- 5. Create notifications table if it doesn't exist (shared infrastructure)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    redirect_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
        CREATE POLICY "Users can view their own notifications"
            ON public.notifications FOR SELECT
            USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = notifications.user_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications (mark as read)') THEN
        CREATE POLICY "Users can update their own notifications (mark as read)"
            ON public.notifications FOR UPDATE
            USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = notifications.user_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System/Users can insert notifications') THEN
        CREATE POLICY "System/Users can insert notifications"
            ON public.notifications FOR INSERT
            WITH CHECK (true); -- Allow any authenticated user to send notification (e.g. founder to investor)
    END IF;
END $$;

-- 3. Create Storage Bucket for Payment Proofs if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for payment-proofs') THEN
        CREATE POLICY "Public Access for payment-proofs"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'payment-proofs' );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Uploads for payment-proofs') THEN
        CREATE POLICY "Authenticated Uploads for payment-proofs"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'payment-proofs' AND
          auth.role() = 'authenticated'
        );
    END IF;
END $$;
