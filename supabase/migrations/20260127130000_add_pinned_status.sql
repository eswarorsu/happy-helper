-- Add pinned status columns to chat_requests table
ALTER TABLE chat_requests ADD COLUMN IF NOT EXISTS founder_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_requests ADD COLUMN IF NOT EXISTS investor_pinned BOOLEAN DEFAULT FALSE;
