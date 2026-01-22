-- ============================================
-- AI Chat System Tables
-- Replaces Pickaxe embeds with custom chatbot
-- ============================================

-- AI Tools table - stores chatbot configurations
CREATE TABLE IF NOT EXISTS ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  max_tokens INTEGER DEFAULT 1024,
  welcome_message TEXT,
  suggested_prompts JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Conversations table - groups messages per user/tool
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES bootcamp_students(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ai_tools(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages table - individual messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_tools_slug ON ai_tools(slug);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_student_id ON chat_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_tool_id ON chat_conversations(tool_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_student_tool ON chat_conversations(student_id, tool_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- ============================================
-- Row Level Security Policies
-- (Simple public access - matches existing app auth pattern)
-- ============================================
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- AI Tools: Public read for active tools, public write for admin
CREATE POLICY "Public read ai_tools" ON ai_tools FOR SELECT USING (true);
CREATE POLICY "Public insert ai_tools" ON ai_tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update ai_tools" ON ai_tools FOR UPDATE USING (true);
CREATE POLICY "Public delete ai_tools" ON ai_tools FOR DELETE USING (true);

-- Chat Conversations: Public access (app handles auth via student_id)
CREATE POLICY "Public read conversations" ON chat_conversations FOR SELECT USING (true);
CREATE POLICY "Public insert conversations" ON chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update conversations" ON chat_conversations FOR UPDATE USING (true);

-- Chat Messages: Public access (app handles auth via conversation ownership)
CREATE POLICY "Public read messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Public insert messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- ============================================
-- Trigger to auto-update updated_at timestamp
-- ============================================
DROP TRIGGER IF EXISTS update_ai_tools_updated_at ON ai_tools;
CREATE TRIGGER update_ai_tools_updated_at
  BEFORE UPDATE ON ai_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
