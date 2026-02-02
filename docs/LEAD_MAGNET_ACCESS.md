# Lead Magnet Access System

Progressive access system for lead magnet funnels. Each invite code defines exactly what it unlocks — specific AI tools with credit limits, specific curriculum weeks, or both.

## Access Tiers

| Tier | What they see | How they get it |
|------|--------------|-----------------|
| **Full Access** | Everything (AI tools, curriculum, resources) | Default for paid users / existing codes |
| **Lead Magnet** | Only specifically unlocked tools + content | Register or redeem a lead magnet code |
| **Curriculum Only** | Curriculum only, no AI tools | Legacy tier |

## Creating Lead Magnet Codes (Admin UI)

1. Go to **Admin > Bootcamp > Invite Codes** (`/admin/bootcamp/invite-codes`)
2. Click **Generate Codes**
3. Fill in the form:
   - **Cohort**: Select the cohort for these users
   - **Access Level**: Select **Lead Magnet**
   - **AI Tool Credits**: Click "Add Tool" to pick which tools to unlock and how many credits each
   - **Curriculum Week IDs**: Comma-separated week IDs if you want to unlock specific curriculum weeks (e.g. `week-1, week-3`)
   - **Custom Code**: Set a memorable code like `FREEPOSTS` (leave blank for auto-generated)
   - **Max Uses**: Limit how many people can use this code (leave blank for unlimited)
   - **Expiration Date**: Set a deadline (leave blank for no expiration)
4. Click **Create Lead Magnet Code**

The code and its access level / grants are shown in the invite codes table with a purple "Lead Magnet" badge.

## How the Funnel Works

1. **Build a landing page / ad** pointing to `modernagencysales.com/bootcamp?code=FREEPOSTS`
2. **New user clicks link**:
   - Not logged in → Registration page with code pre-filled
   - Already logged in → Code auto-redeems, new tools appear in sidebar
3. **User sees only what the code unlocked**: specific AI tools (with credit count badge), and optionally specific curriculum weeks
4. **Each AI tool message uses 1 credit**. When credits run out, the tool locks with a "Book a Call" CTA
5. **User can redeem additional codes** via the "Unlock More Tools" button in the sidebar, which opens a code entry modal
6. **A Full Access code** (or purchase) unlocks everything — zero restrictions

## Managing Codes

### From the Admin UI

- **Enable/disable** any code using the toggle in the table
- **Delete** codes with the trash icon
- **Copy registration link** with the link icon (copies `modernagencysales.com/bootcamp/register?code=YOURCODE`)
- **Filter** by cohort or search by code name

### Useful SQL Queries

**See who redeemed what:**
```sql
SELECT s.email, r.code, r.redeemed_at
FROM student_redeemed_codes r
JOIN bootcamp_students s ON s.id = r.student_id
ORDER BY r.redeemed_at DESC;
```

**Check a student's remaining credits:**
```sql
SELECT t.name AS tool_name, SUM(c.credits_total - c.credits_used) AS credits_remaining
FROM student_tool_credits c
JOIN ai_tools t ON t.id = c.tool_id
WHERE c.student_id = 'STUDENT_ID'
GROUP BY t.name;
```

**Manually add credits to a student:**
```sql
INSERT INTO student_tool_credits (student_id, tool_id, credits_total, credits_used, granted_by_code)
SELECT 'STUDENT_ID', id, 10, 0, 'MANUAL'
FROM ai_tools WHERE slug = 'post-generator';
```

**Upgrade a Lead Magnet user to Full Access:**
```sql
UPDATE bootcamp_students SET access_level = 'Full Access' WHERE email = 'user@example.com';
```

## Week IDs

Week IDs come from your curriculum. Check the LMS admin at `/admin/lms/curriculum` to find them, or run:

```sql
SELECT DISTINCT week_id FROM lms_lessons ORDER BY week_id;
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `bootcamp_invite_codes` | Extended with `access_level`, `tool_grants`, `content_grants` columns |
| `student_tool_credits` | Per-student, per-tool credit balances |
| `student_content_grants` | Which curriculum weeks a Lead Magnet student can access |
| `student_redeemed_codes` | Tracks which codes each student has redeemed (prevents double-redeem) |

## Testing Checklist

1. Create a lead magnet code via admin UI with tool grants
2. Open `modernagencysales.com/bootcamp?code=YOURCODE` in incognito
3. Register → verify only granted tools visible with credit count
4. Send messages → credits decrement, count updates in real time
5. Exhaust credits → tool locks with "Book a Call" CTA
6. Log in, visit `?code=ANOTHER` → auto-redeem adds new tools
7. Existing Full Access users → verify zero regression
