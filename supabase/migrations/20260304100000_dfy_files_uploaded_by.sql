-- Add uploaded_by column to dfy_intake_files to distinguish client vs admin uploads
ALTER TABLE dfy_intake_files
  ADD COLUMN IF NOT EXISTS uploaded_by TEXT NOT NULL DEFAULT 'client';

-- Add check constraint (use DO block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dfy_intake_files_uploaded_by_check'
  ) THEN
    ALTER TABLE dfy_intake_files
      ADD CONSTRAINT dfy_intake_files_uploaded_by_check
      CHECK (uploaded_by IN ('client', 'admin'));
  END IF;
END $$;
