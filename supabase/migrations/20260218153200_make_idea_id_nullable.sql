-- Migration: Make idea_id nullable in chat_requests to allow generic connections
ALTER TABLE public.chat_requests ALTER COLUMN idea_id DROP NOT NULL;
