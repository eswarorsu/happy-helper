-- Investor Ratings Table
-- Allows founders to rate investors after interactions (thumbs up/down)
-- This builds a trust score for investors visible to all founders

CREATE TABLE IF NOT EXISTS investor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  founder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chat_request_id UUID REFERENCES chat_requests(id) ON DELETE CASCADE,
  rating BOOLEAN NOT NULL, -- true = thumbs up, false = thumbs down
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each founder can only rate an investor once per chat request
  UNIQUE(investor_id, founder_id, chat_request_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_investor_ratings_investor ON investor_ratings(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_ratings_founder ON investor_ratings(founder_id);

-- Enable RLS
ALTER TABLE investor_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view ratings (for trust score calculation)
CREATE POLICY "Anyone can view investor ratings"
  ON investor_ratings FOR SELECT
  USING (true);

-- Policy: Founders can insert ratings for investors they've interacted with
CREATE POLICY "Founders can rate investors"
  ON investor_ratings FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM profiles WHERE id = founder_id)
    AND EXISTS (
      SELECT 1 FROM chat_requests 
      WHERE id = chat_request_id 
      AND founder_id = investor_ratings.founder_id
      AND investor_id = investor_ratings.investor_id
      AND status IN ('communicating', 'deal_pending_investor', 'deal_done')
    )
  );

-- Policy: Founders can update their own ratings
CREATE POLICY "Founders can update their ratings"
  ON investor_ratings FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = founder_id));

-- Function to get investor trust score
CREATE OR REPLACE FUNCTION get_investor_trust_score(p_investor_id UUID)
RETURNS TABLE (
  total_ratings BIGINT,
  positive_ratings BIGINT,
  trust_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_ratings,
    COUNT(*) FILTER (WHERE rating = true)::BIGINT as positive_ratings,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE rating = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1)
    END as trust_percentage
  FROM investor_ratings
  WHERE investor_id = p_investor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
