-- Add DiscoLike refinement support: similarity scores, feedback, and refine job type

-- New columns on tam_companies
ALTER TABLE tam_companies ADD COLUMN IF NOT EXISTS similarity_score REAL;
ALTER TABLE tam_companies ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('liked', 'disliked'));

-- New job type for DiscoLike refinement
ALTER TYPE tam_job_type ADD VALUE IF NOT EXISTS 'refine_discolike';
