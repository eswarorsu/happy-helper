-- Add is_admin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add is_approved column to profiles table (seems missing from types too based on earlier error logs/context)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- Update existing profiles to have default values
UPDATE public.profiles SET is_admin = false WHERE is_admin IS NULL;
UPDATE public.profiles SET is_approved = false WHERE is_approved IS NULL;
