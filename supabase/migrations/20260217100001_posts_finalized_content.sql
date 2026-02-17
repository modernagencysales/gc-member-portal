-- Add finalized_content column to posts table for the Post Finalizer feature
-- Referenced by: services/blueprint-supabase.ts (POST_COLUMNS, updatePostFinalizedContent)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS finalized_content TEXT;
