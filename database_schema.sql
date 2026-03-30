-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_type enum
DO $$ BEGIN
    CREATE TYPE public.user_type AS ENUM ('founder', 'investor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 1. PROFILES TABLE
-- Stores user identity, professional details, and verification status.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    user_type user_type NOT NULL,
    
    -- Verification & Admin
    is_approved BOOLEAN DEFAULT false, -- For admin verification
    is_admin BOOLEAN DEFAULT false,
    
    -- Founder Specific
    current_status TEXT, -- e.g. "Student", "Graduate"
    current_job TEXT,
    experience TEXT,
    domain TEXT,
    linkedin_profile TEXT,
    website_url TEXT,
    founder_context JSONB, -- Stores startup stage, goals, challenges, etc.
    
    -- Investor Specific
    investment_capital NUMERIC, -- Total capital available
    interested_domains TEXT[], -- Array of strings e.g. ["AI", "Fintech"]
    date_of_birth DATE,
    nationality TEXT,
    city TEXT,
    investor_type TEXT, -- 'angel', 'vc', 'individual', 'family_office', 'hni'
    investing_experience INTEGER DEFAULT 0,
    current_designation TEXT,
    organization TEXT,
    professional_bio TEXT,
    investment_range TEXT, -- '1L-10L', '10L-50L', etc.
    preferred_stage TEXT[], -- ['Pre-Seed', 'Seed']
    previous_investments TEXT,
    roi_timeline TEXT, -- '1-3years', '3-5years', '5+years'
    pan_last4 TEXT,
    is_accredited BOOLEAN DEFAULT false,
    
    -- Common
    education TEXT,
    dob DATE, -- Legacy, see date_of_birth
    phone TEXT,
    bio TEXT,
    upi_id TEXT, -- UPI ID for payments (both founder receiving investments and investor receiving returns)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- ==========================================
-- 2. IDEAS TABLE
-- Stores startup ideas submitted by founders.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Core Info
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    domain TEXT NOT NULL,
    
    -- Funding Data
    investment_needed NUMERIC NOT NULL,
    investment_received NUMERIC DEFAULT 0,
    
    -- Status: 'pending', 'approved', 'in_progress', 'funded', 'deal_done'
    status TEXT DEFAULT 'pending',
    
    -- Pitch & Traction
    media_url TEXT, -- Pitch deck link (Google Drive etc.)
    team_size TEXT, -- "Solo Founder", "2-5 People"
    market_size TEXT, -- e.g. "$10B TAM"
    traction TEXT, -- "Idea Stage", "MVP", "Revenue"
    
    -- Socials
    linkedin_url TEXT,
    website_url TEXT,
    
    -- Location & Contact
    location_lat NUMERIC,
    location_lng NUMERIC,
    founder_city TEXT,
    founder_phone TEXT,
    work_mode TEXT,
    company_logo_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. CHAT REQUESTS TABLE
-- Manages connections between Investors and Founders.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.chat_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    
    -- Status flow: pending -> accepted/rejected -> communicating -> deal_pending -> deal_done
    status TEXT DEFAULT 'pending', 
    
    founder_pinned BOOLEAN DEFAULT false,
    unread_count INTEGER DEFAULT 0, -- Cache for UI badge
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. MESSAGES TABLE
-- Stores chat history (Note: App uses Firebase, but this table is kept for SQL sync/backup).
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. INVESTMENT RECORDS TABLE
-- Tracks actual investments made by investors into ideas.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.investment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    chat_request_id UUID REFERENCES public.chat_requests(id),
    
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed', -- 'completed', 'confirmed'
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. INVESTOR RATINGS TABLE
-- Allows founders/investors to rate interactions (Thumbs up/down).
-- ==========================================
CREATE TABLE IF NOT EXISTS public.investor_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    rating BOOLEAN NOT NULL, -- TRUE = Thumbs Up, FALSE = Thumbs Down
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 7. PAYMENTS TABLE
-- Logs Razorpay transactions for audit.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL, -- Linked after submission
    
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending', -- 'success', 'pending', 'failed'
    
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 8. COUPONS TABLE
-- Tracks usage of discount codes.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    usage_count INTEGER DEFAULT 0,
    max_limit INTEGER DEFAULT 5
);

-- Insert default coupons if not exist
INSERT INTO public.coupons (code, max_limit) VALUES 
('FREEIDEA', 5), 
('INNOVATE50', 5)
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- 9. PRODUCTS TABLE
-- Allows founders to list products for marketing/marketplace.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    image_url TEXT,
    category TEXT,
    is_live BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RPC to redeem coupon securely
CREATE OR REPLACE FUNCTION redeem_coupon(coupon_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage INTEGER;
    limit_val INTEGER;
BEGIN
    SELECT usage_count, max_limit INTO current_usage, limit_val
    FROM public.coupons
    WHERE code = coupon_code;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF current_usage >= limit_val THEN
        RETURN FALSE;
    END IF;
    
    UPDATE public.coupons
    SET usage_count = usage_count + 1
    WHERE code = coupon_code;
    
    RETURN TRUE;
END;
$$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);
    
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- 2. Ideas
DROP POLICY IF EXISTS "Ideas are viewable by everyone" ON public.ideas;
CREATE POLICY "Ideas are viewable by everyone" 
    ON public.ideas FOR SELECT USING (true);
    
DROP POLICY IF EXISTS "Founders can insert ideas" ON public.ideas;
CREATE POLICY "Founders can insert ideas" 
    ON public.ideas FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id));
    
DROP POLICY IF EXISTS "Founders can update own ideas" ON public.ideas;
CREATE POLICY "Founders can update own ideas" 
    ON public.ideas FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id));

-- 3. Chat Requests & Connections
DROP POLICY IF EXISTS "Users can view their own chat requests" ON public.chat_requests;
CREATE POLICY "Users can view their own chat requests" 
    ON public.chat_requests FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));
    
DROP POLICY IF EXISTS "Users can insert chat requests" ON public.chat_requests;
CREATE POLICY "Users can insert chat requests" 
    ON public.chat_requests FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));
    
DROP POLICY IF EXISTS "Users can update their own chat requests" ON public.chat_requests;
CREATE POLICY "Users can update their own chat requests" 
    ON public.chat_requests FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- 4. Messages (If used)
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" 
    ON public.messages FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.chat_requests cr
        WHERE cr.id = chat_request_id
        AND auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = cr.founder_id OR id = cr.investor_id)
    ));
    
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
CREATE POLICY "Users can send messages to their chats" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = sender_id));

-- 5. Payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" 
    ON public.payments FOR SELECT USING (auth.uid() = user_id);
    
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" 
    ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
    
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments" 
    ON public.payments FOR UPDATE USING (auth.uid() = user_id);

-- 6. Investment Records
DROP POLICY IF EXISTS "Users can view own investments" ON public.investment_records;
CREATE POLICY "Users can view own investments" 
    ON public.investment_records FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- 7. Admin Access (Global)
-- Allow admins to view all data in critical tables
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" 
    ON public.payments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- 7. Ratings
DROP POLICY IF EXISTS "Users can manage ratings" ON public.investor_ratings;
CREATE POLICY "Users can manage ratings" 
    ON public.investor_ratings FOR ALL 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- 8. Coupons
DROP POLICY IF EXISTS "Public can view coupons" ON public.coupons;
CREATE POLICY "Public can view coupons" 
    ON public.coupons FOR SELECT USING (true);

-- ==========================================
-- 9. VIEW LOGS
-- Tracks when investors view ideas.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.view_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 10. NOTIFICATIONS
-- Stores alerts for users.
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT, -- 'view', 'message', 'deal', etc.
    redirect_url TEXT, -- URL to navigate when notification is clicked
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- RLS POLICIES FOR NEW TABLES
-- ==========================================

-- 9. View Logs
ALTER TABLE public.view_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View logs are viewable by the founder of the idea" ON public.view_logs;
CREATE POLICY "View logs are viewable by the founder of the idea" 
    ON public.view_logs FOR SELECT 
    USING (auth.uid() IN (
        SELECT p.user_id FROM public.profiles p 
        JOIN public.ideas i ON i.founder_id = p.id 
        WHERE i.id = idea_id
    ));

DROP POLICY IF EXISTS "Investors can insert view logs" ON public.view_logs;
CREATE POLICY "Investors can insert view logs" 
    ON public.view_logs FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = viewer_id));

-- 10. Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = notifications.user_id));

-- SECURITY FIX: Restrict notification inserts to authenticated users only
-- Previously allowed ANY user to insert notifications to ANY user (spam vector)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = notifications.user_id));

-- 11. Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone" 
    ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Founders can manage their own products" ON public.products;
CREATE POLICY "Founders can manage their own products" 
    ON public.products FOR ALL 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id));

-- ==========================================
-- 12. UPI TRANSACTIONS TABLE
-- Tracks UPI-based investment payments between investors and founders.
-- Flow: investor_confirmed → completed (when founder confirms receipt)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.upi_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    
    amount NUMERIC NOT NULL,
    founder_upi_id TEXT, -- UPI ID the payment was sent to
    payment_proof_url TEXT, -- Screenshot of UPI payment
    status TEXT DEFAULT 'investor_confirmed', -- 'investor_confirmed', 'completed'
    
    investor_confirmed_at TIMESTAMP WITH TIME ZONE,
    founder_confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.upi_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own UPI transactions" ON public.upi_transactions;
CREATE POLICY "Users can view their own UPI transactions"
    ON public.upi_transactions FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

DROP POLICY IF EXISTS "Users can insert UPI transactions" ON public.upi_transactions;
CREATE POLICY "Users can insert UPI transactions"
    ON public.upi_transactions FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

DROP POLICY IF EXISTS "Users can update their own UPI transactions" ON public.upi_transactions;
CREATE POLICY "Users can update their own UPI transactions"
    ON public.upi_transactions FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- ==========================================
-- 13. PROFIT TRANSACTIONS TABLE
-- Tracks profit-sharing payments from founders to investors.
-- Flow: founder_confirmed → completed (when investor confirms receipt)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    
    amount NUMERIC NOT NULL,
    description TEXT,
    investor_upi_id TEXT, -- UPI ID the profit was sent to
    payment_proof_url TEXT, -- Screenshot of UPI payment
    status TEXT DEFAULT 'founder_confirmed', -- 'founder_confirmed', 'completed'
    
    founder_confirmed_at TIMESTAMP WITH TIME ZONE,
    investor_confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profit transactions" ON public.profit_transactions;
CREATE POLICY "Users can view their own profit transactions"
    ON public.profit_transactions FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

DROP POLICY IF EXISTS "Founders can insert profit transactions" ON public.profit_transactions;
CREATE POLICY "Founders can insert profit transactions"
    ON public.profit_transactions FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id));

DROP POLICY IF EXISTS "Users can update profit transactions" ON public.profit_transactions;
CREATE POLICY "Users can update profit transactions"
    ON public.profit_transactions FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- ==========================================
-- 14. PROFIT SHARES TABLE
-- Official confirmed profit share records (created after investor confirms profit_transaction).
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profit_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
    
    amount NUMERIC NOT NULL,
    description TEXT,
    payment_proof_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profit_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profit shares" ON public.profit_shares;
CREATE POLICY "Users can view their own profit shares"
    ON public.profit_shares FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

DROP POLICY IF EXISTS "Users can insert profit shares" ON public.profit_shares;
CREATE POLICY "Users can insert profit shares"
    ON public.profit_shares FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_ideas_founder_id ON public.ideas(founder_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON public.ideas(status);
CREATE INDEX IF NOT EXISTS idx_chat_requests_founder_id ON public.chat_requests(founder_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_investor_id ON public.chat_requests(investor_id);
CREATE INDEX IF NOT EXISTS idx_chat_requests_status ON public.chat_requests(status);
CREATE INDEX IF NOT EXISTS idx_investment_records_founder_id ON public.investment_records(founder_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_investor_id ON public.investment_records(investor_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_idea_id ON public.investment_records(idea_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_upi_transactions_chat_request_id ON public.upi_transactions(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_profit_transactions_chat_request_id ON public.profit_transactions(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_profit_shares_chat_request_id ON public.profit_shares(chat_request_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_idea_id ON public.view_logs(idea_id);
