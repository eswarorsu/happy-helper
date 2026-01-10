-- Create user type enum
CREATE TYPE public.user_type AS ENUM ('founder', 'investor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_type user_type NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  education TEXT,
  experience TEXT,
  current_job TEXT,
  linkedin_profile TEXT,
  domain TEXT,
  investment_capital NUMERIC,
  interested_domains TEXT[],
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Public read for basic info (for chat requests)
CREATE POLICY "Authenticated users can view basic profile info"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Create ideas table
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  domain TEXT NOT NULL,
  investment_needed NUMERIC NOT NULL,
  investment_received NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'funded', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- RLS policies for ideas
CREATE POLICY "Founders can manage their own ideas"
ON public.ideas FOR ALL
USING (founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Investors can view all ideas"
ON public.ideas FOR SELECT
TO authenticated
USING (true);

-- Create chat requests table
CREATE TABLE public.chat_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat requests
CREATE POLICY "Users can view their own chat requests"
ON public.chat_requests FOR SELECT
TO authenticated
USING (
  investor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
  founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Investors can create chat requests"
ON public.chat_requests FOR INSERT
TO authenticated
WITH CHECK (investor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Founders can update chat request status"
ON public.chat_requests FOR UPDATE
TO authenticated
USING (founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_request_id UUID REFERENCES public.chat_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Chat participants can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  chat_request_id IN (
    SELECT id FROM public.chat_requests 
    WHERE investor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Chat participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
  chat_request_id IN (
    SELECT id FROM public.chat_requests 
    WHERE status = 'accepted' AND (
      investor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      OR founder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();