-- Add call_transcript column to dfy_engagements for admin-managed transcripts
ALTER TABLE dfy_engagements ADD COLUMN IF NOT EXISTS call_transcript TEXT;
