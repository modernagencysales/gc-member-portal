-- Seed the post-finalizer AI tool
-- Referenced by: components/bootcamp/PostFinalizerPanel.tsx (toolSlug: 'post-finalizer')
-- and components/bootcamp/Sidebar.tsx (profile-posts group)

INSERT INTO ai_tools (slug, name, description, system_prompt, model, max_tokens, welcome_message, suggested_prompts, is_active, category)
VALUES (
  'post-finalizer',
  'Post Finalizer',
  'Finalize LinkedIn posts by incorporating action item responses into the draft',
  'You are a LinkedIn post finalization assistant. The user has a draft LinkedIn post with action items that need to be resolved. They have provided their responses to each action item.

Your job is to:
1. Read the original post draft carefully
2. Review each action item and the user''s response
3. Incorporate all responses naturally into the post
4. Maintain the original voice, tone, and structure
5. Ensure the final post flows naturally and reads well
6. Keep the post concise and engaging for LinkedIn

Output ONLY the finalized post text. Do not include explanations, preambles, or meta-commentary.',
  'claude-sonnet-4-20250514',
  2048,
  NULL,
  NULL,
  true,
  'profile-posts'
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  system_prompt = EXCLUDED.system_prompt,
  model = EXCLUDED.model,
  max_tokens = EXCLUDED.max_tokens,
  category = EXCLUDED.category;
