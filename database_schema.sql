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
    
    -- Investor Specific
    investment_capital NUMERIC, -- Total capital available
    interested_domains TEXT[], -- Array of strings e.g. ["AI", "Fintech"]
    
    -- Common
    education TEXT,
    dob DATE,
    phone TEXT,
    bio TEXT,
    
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

-- 1. Profiles
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);
    
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- 2. Ideas
CREATE POLICY "Ideas are viewable by everyone" 
    ON public.ideas FOR SELECT USING (true);
    
CREATE POLICY "Founders can insert ideas" 
    ON public.ideas FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id));
    
CREATE POLICY "Founders can update own ideas" 
    ON public.ideas FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id));

-- 3. Chat Requests & Connections
CREATE POLICY "Users can view their own chat requests" 
    ON public.chat_requests FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));
    
CREATE POLICY "Users can insert chat requests" 
    ON public.chat_requests FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));
    
CREATE POLICY "Users can update their own chat requests" 
    ON public.chat_requests FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- 4. Messages (If used)
CREATE POLICY "Users can view messages in their chats" 
    ON public.messages FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.chat_requests cr
        WHERE cr.id = chat_request_id
        AND auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = cr.founder_id OR id = cr.investor_id)
    ));
    
CREATE POLICY "Users can send messages to their chats" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = sender_id));

-- 5. Payments
CREATE POLICY "Users can view own payments" 
    ON public.payments FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert own payments" 
    ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update own payments" 
    ON public.payments FOR UPDATE USING (auth.uid() = user_id);

-- 6. Investment Records
CREATE POLICY "Users can view own investments" 
    ON public.investment_records FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));

-- 7. Ratings
CREATE POLICY "Users can manage ratings" 
    ON public.investor_ratings FOR ALL 
    USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id OR id = investor_id));
