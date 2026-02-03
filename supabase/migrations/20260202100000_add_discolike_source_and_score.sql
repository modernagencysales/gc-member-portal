-- Add 'discolike' to company source enum and digital_footprint_score column
ALTER TYPE tam_company_source ADD VALUE IF NOT EXISTS 'discolike';
ALTER TABLE tam_companies ADD COLUMN IF NOT EXISTS digital_footprint_score INTEGER;
