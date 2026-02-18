-- Comprehensive UPI Payment System Setup
-- This migration sets up everything needed for UPI payments and profit sharing

-- ============================================
-- 1. STORAGE BUCKET FOR PAYMENT PROOFS
-- ============================================
-- Note: Run this in Supabase SQL Editor or via Dashboard -> Storage -> New Bucket

-- Create storage bucket (if using SQL - some Supabase setups require dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    true,  -- public bucket so images can be viewed
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow anyone to view (public bucket)
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

-- Allow users to update/delete their own uploads
CREATE POLICY "Users can manage their own payment proofs"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 2. UPI TRANSACTIONS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.upi_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_request_id UUID NOT NULL REFERENCES public.chat_requests(id) ON DELETE CASCADE,
    founder_id UUID NOT NULL REFERENCES public.profiles(id),
    investor_id UUID NOT NULL REFERENCES public.profiles(id),
    idea_id UUID NOT NULL REFERENCES public.ideas(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    founder_upi_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'investor_confirmed' CHECK (status IN ('investor_confirmed', 'completed', 'cancelled')),
    payment_proof_url TEXT,
    investor_confirmed_at TIMESTAMPTZ,
    founder_confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upi_transactions_chat_request ON public.upi_transactions(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_upi_transactions_status ON public.upi_transactions(status);

-- RLS
ALTER TABLE public.upi_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own upi transactions" ON public.upi_transactions;
CREATE POLICY "Users can view their own upi transactions"
    ON public.upi_transactions FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles WHERE id IN (founder_id, investor_id)
        )
    );

DROP POLICY IF EXISTS "Users can insert upi transactions" ON public.upi_transactions;
CREATE POLICY "Users can insert upi transactions"
    ON public.upi_transactions FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.profiles WHERE id IN (founder_id, investor_id)
        )
    );

DROP POLICY IF EXISTS "Users can update their upi transactions" ON public.upi_transactions;
CREATE POLICY "Users can update their upi transactions"
    ON public.upi_transactions FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles WHERE id IN (founder_id, investor_id)
        )
    );

-- ============================================
-- 3. PROFIT TRANSACTIONS TABLE (if not exists)
-- ============================================
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profit_transactions_chat_request ON public.profit_transactions(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_status ON public.profit_transactions(status);

-- RLS
ALTER TABLE public.profit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their profit transactions" ON public.profit_transactions;
CREATE POLICY "Users can view their profit transactions"
    ON public.profit_transactions FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles WHERE id IN (founder_id, investor_id)
        )
    );

DROP POLICY IF EXISTS "Users can insert profit transactions" ON public.profit_transactions;
CREATE POLICY "Users can insert profit transactions"
    ON public.profit_transactions FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.profiles WHERE id IN (founder_id, investor_id)
        )
    );

DROP POLICY IF EXISTS "Users can update profit transactions" ON public.profit_transactions;
CREATE POLICY "Users can update profit transactions"
    ON public.profit_transactions FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.profiles WHERE id IN (founder_id, investor_id)
        )
    );

-- ============================================
-- 4. ADD UPI_ID TO PROFILES (if not exists)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'upi_id') THEN
        ALTER TABLE public.profiles ADD COLUMN upi_id TEXT;
    END IF;
END $$;

-- ============================================
-- 5. TRIGGER: AUTO-UPDATE investment_received
-- ============================================
CREATE OR REPLACE FUNCTION update_investment_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.ideas
        SET investment_received = COALESCE(investment_received, 0) + NEW.amount
        WHERE id = NEW.idea_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_investment ON public.upi_transactions;
CREATE TRIGGER trigger_update_investment
    AFTER UPDATE ON public.upi_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_investment_on_completion();
