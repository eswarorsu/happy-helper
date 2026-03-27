-- ==========================================
-- ADD LOCATION COLUMNS TO IDEAS TABLE
-- For Startup Map feature
-- ==========================================

-- Latitude and Longitude of the startup's operating location
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS location_lat NUMERIC;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS location_lng NUMERIC;

-- Company logo URL for map markers
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- City and work mode (may already exist from frontend, adding IF NOT EXISTS for safety)
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS founder_city TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS founder_phone TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS work_mode TEXT;

-- ==========================================
-- ADD LOCATION TRACKING TO PROFILES TABLE
-- For admin visibility and AI recommendations
-- ==========================================

-- Last known browser geolocation of the user
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_known_lat NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_known_lng NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_location_updated_at TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- INDEX for geospatial queries
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_ideas_location ON public.ideas (location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (last_known_lat, last_known_lng)
  WHERE last_known_lat IS NOT NULL AND last_known_lng IS NOT NULL;
