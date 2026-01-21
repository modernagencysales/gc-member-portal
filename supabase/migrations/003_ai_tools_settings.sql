-- ============================================
-- AI TOOLS PAGE SETTINGS
-- Adds configurable text for the AI Tools onboarding page
-- ============================================

-- Insert AI Tools page settings with defaults
INSERT INTO bootcamp_settings (key, value, description) VALUES
  ('ai_tools_title', '"Your AI-Powered Toolkit"', 'Title for the AI Tools onboarding page'),
  ('ai_tools_subtitle', '"As part of your bootcamp access, you have full access to these AI tools to accelerate your LinkedIn outreach."', 'Subtitle for the AI Tools onboarding page'),
  ('ai_tools_info_title', '"Full Access Included"', 'Title for the info box on AI Tools page'),
  ('ai_tools_info_text', '"All AI tools are included with your bootcamp access. You''''ll learn how to use each one effectively throughout the curriculum."', 'Text for the info box on AI Tools page')
ON CONFLICT (key) DO NOTHING;
