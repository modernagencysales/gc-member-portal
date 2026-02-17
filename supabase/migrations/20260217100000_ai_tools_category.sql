-- Add category column to ai_tools for grouping tools in the sidebar
-- Referenced by: services/chat-supabase.ts, components/admin/bootcamp/ai-tools/
ALTER TABLE ai_tools ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for filtering by category
CREATE INDEX IF NOT EXISTS idx_ai_tools_category ON ai_tools(category);
