# AI Chat System Deployment Guide

## What's Been Done

1. **Database migrations created** - `supabase/migrations/004_ai_chat_tables.sql` and `005_seed_ai_tools.sql`
2. **Edge Function created** - `supabase/functions/chat/index.ts`
3. **All code implemented** - Types, services, hooks, and UI components
4. **Airtable updated** - All 8 Pickaxe lessons now use `ai-tool:` URLs

## Remaining Steps

### 1. Run Database Migrations

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qvawbxpijxlwdkolmjrs)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/004_ai_chat_tables.sql`
4. Click **Run**
5. Copy and paste the contents of `supabase/migrations/005_seed_ai_tools.sql`
6. Click **Run**

**Option B: Via CLI**

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref qvawbxpijxlwdkolmjrs

# Push migrations
supabase db push
```

### 2. Deploy Edge Function

```bash
# Login if not already
supabase login

# Link project if not already
supabase link --project-ref qvawbxpijxlwdkolmjrs

# Deploy the chat function
supabase functions deploy chat
```

### 3. Set Anthropic API Key

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

Or via Dashboard:
1. Go to **Project Settings** → **Edge Functions**
2. Add secret: `ANTHROPIC_API_KEY` with your Anthropic API key

### 4. Verify Deployment

1. Go to `/admin/bootcamp/ai-tools` to see the 8 seeded AI tools
2. Navigate to a lesson with an AI tool (e.g., "TOOL: Post Generator" in Week 0)
3. Test the chat interface

## AI Tools Migrated

| Tool | Slug | Old Pickaxe ID |
|------|------|----------------|
| Transcript Post Idea Grabber | `transcript-post-idea-grabber` | deployment-24fd943d... |
| Profile Optimizer | `profile-optimizer` | deployment-4f004586... |
| Lead Magnet Post Creator | `lead-magnet-post-creator` | deployment-dde8014b... |
| Lead Magnet Creator | `lead-magnet-creator` | deployment-006d7f35... |
| Lead Magnet Ideator | `lead-magnet-ideator` | deployment-63a63e0a... |
| Post Generator | `post-generator` | deployment-71328169... |
| DM Chat Helper | `dm-chat-helper` | deployment-8d5de8e9... |
| Cold Email Mastermind | `cold-email-mastermind` | deployment-4a1f5284... |

## Updating System Prompts

The seed data includes placeholder system prompts. To use your actual Pickaxe prompts:

1. Go to `/admin/bootcamp/ai-tools`
2. Click **Edit** on each tool
3. Paste your original system prompt from Pickaxe
4. Update welcome message and suggested prompts as needed
5. Click **Save Changes**

## Cost Tracking

Token usage is tracked in the `chat_messages` table:
- `input_tokens` - Tokens sent to Claude
- `output_tokens` - Tokens received from Claude

You can query costs with:
```sql
SELECT
  t.name,
  SUM(m.input_tokens) as total_input,
  SUM(m.output_tokens) as total_output,
  COUNT(*) as message_count
FROM chat_messages m
JOIN chat_conversations c ON m.conversation_id = c.id
JOIN ai_tools t ON c.tool_id = t.id
GROUP BY t.name;
```

## Troubleshooting

**Chat not loading:**
- Check browser console for errors
- Verify Edge Function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs chat`

**"AI Tool Not Found" error:**
- Verify migrations ran successfully
- Check the slug matches exactly (case-sensitive)
- Ensure the tool is marked as `is_active = true`

**Streaming not working:**
- Ensure ANTHROPIC_API_KEY is set correctly
- Check Edge Function logs for API errors
