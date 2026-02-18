-- Migration: Add idea_id to products table to link products to specific ideas
ALTER TABLE public.products ADD COLUMN idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE;

-- Update existing products if any (though likely none linked yet)
-- For now, we allow idea_id to be NULL for legacy or general products, 
-- but moving forward we will prefer linking them.
