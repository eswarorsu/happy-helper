-- Add payment_proof_url to profit_shares table
ALTER TABLE profit_shares
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
