-- Investment Records Table
-- Tracks individual investment transactions between investors and founders
-- This provides a proper audit trail for all funding received

CREATE TABLE IF NOT EXISTS investment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES profiles(id) NOT NULL,
  founder_id UUID REFERENCES profiles(id) NOT NULL,
  chat_request_id UUID REFERENCES chat_requests(id),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  payment_method TEXT DEFAULT 'bank_transfer',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_investment_records_idea ON investment_records(idea_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_investor ON investment_records(investor_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_founder ON investment_records(founder_id);
CREATE INDEX IF NOT EXISTS idx_investment_records_date ON investment_records(transaction_date DESC);

-- Enable RLS
ALTER TABLE investment_records ENABLE ROW LEVEL SECURITY;

-- Policy: Founders can see investments in their ideas
CREATE POLICY "Founders can view investments in their ideas"
  ON investment_records FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = founder_id
  ));

-- Policy: Investors can see their own investments
CREATE POLICY "Investors can view their investments"
  ON investment_records FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = investor_id
  ));

-- Policy: Founders can insert investment records for their ideas
CREATE POLICY "Founders can record investments"
  ON investment_records FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = founder_id
  ));

-- Policy: Founders can update investment records
CREATE POLICY "Founders can update investments"
  ON investment_records FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = founder_id
  ));

-- Function to update investment_received when a record is added
CREATE OR REPLACE FUNCTION update_idea_investment_total()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas 
    SET investment_received = COALESCE(investment_received, 0) + NEW.amount
    WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas 
    SET investment_received = COALESCE(investment_received, 0) - OLD.amount
    WHERE id = OLD.idea_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.amount != OLD.amount THEN
    UPDATE ideas 
    SET investment_received = COALESCE(investment_received, 0) - OLD.amount + NEW.amount
    WHERE id = NEW.idea_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update totals
DROP TRIGGER IF EXISTS trg_update_idea_investment ON investment_records;
CREATE TRIGGER trg_update_idea_investment
  AFTER INSERT OR UPDATE OR DELETE ON investment_records
  FOR EACH ROW EXECUTE FUNCTION update_idea_investment_total();
