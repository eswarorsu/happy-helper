-- Add credibility columns to ideas table
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS team_size TEXT DEFAULT 'Solopreneur',
ADD COLUMN IF NOT EXISTS market_size TEXT,
ADD COLUMN IF NOT EXISTS traction TEXT, -- e.g. "Pre-revenue", "MVP", "$1k MRR"
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;
