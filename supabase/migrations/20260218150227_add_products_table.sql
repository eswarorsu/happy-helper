-- Migration: Add Products Table for Marketing Place
-- This table allows founders to list products for sale or marketing.

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    image_url TEXT,
    category TEXT,
    is_live BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Products are viewable by everyone'
    ) THEN
        CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Founders can manage their products'
    ) THEN
        CREATE POLICY "Founders can manage their products" ON public.products FOR ALL USING (
            auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = founder_id)
        );
    END IF;
END $$;
