# Lead Magnet Invite Codes — Enhanced Admin UI

## Problem

The AI tools lead magnet system is fully built (service layer, database, registration flow, credit tracking) but the admin Generate Codes modal only exposes cohort, count, max uses, and expiry. The `accessLevel`, `toolGrants`, `contentGrants`, and `customCode` fields supported by the backend are not accessible from the UI. This makes it impossible to create tool-granting invite codes without direct database edits.

## Solution

Enhance the existing GenerateCodeModal with 4 new fields and add a "Grants" column to the invite codes table. No new pages, services, or database changes needed.

## Design

### GenerateCodeModal — New Fields

| Field | Type | Default | Notes |
|---|---|---|---|
| Access Level | dropdown | `Lead Magnet` | Options: Lead Magnet, Funnel Access, Curriculum Only, Full Access |
| Tool Grants | multi-select checkboxes | none | Fetched from `fetchActiveAITools()` |
| Credits per Tool | number input (1-100) | 10 | Shared across all selected tools |
| Custom Code | text input | empty | Optional. When set, locks "Number of Codes" to 1 |

### Modal Layout

```
Cohort *                [dropdown]
Access Level            [dropdown, default: Lead Magnet]

── Tool Grants (optional) ──
Credits per tool        [number, 1-100, default: 10]
☑ post-generator
☑ profile-optimizer
☐ dm-chat-helper

── Code Options ──
Custom Code             [text, optional, uppercase]
Number of Codes *       [number, 1-100, disabled if custom code set]
Max Uses                [number, optional]
Expiration Date         [date, optional]
```

### Invite Codes Table — New Column

Add a "Grants" column between "Cohort" and "Uses" showing:
- Access level badge (e.g., "Lead Magnet")
- Tool count + credits summary (e.g., "2 tools · 10 credits each")
- If no grants: "—"

### Key Interactions

- Custom code → locks count to 1 (can't bulk-generate named codes)
- Custom code auto-uppercased
- Tool list fetched from `fetchActiveAITools()` on modal open
- Credits-per-tool shared across all selected tools (matches CallGrantConfigEditor pattern)
- `toolGrants` built as `ToolGrant[]` array: `selectedTools.map(slug => ({ toolSlug: slug, credits: creditsPerTool }))`

## Files Modified

| File | Change |
|---|---|
| `components/admin/bootcamp/invite-codes/GenerateCodeModal.tsx` | Add access level dropdown, tool multi-select, credits input, custom code input. Expand `onGenerate` callback signature. Fetch active AI tools. |
| `components/admin/bootcamp/invite-codes/AdminBootcampInviteCodesPage.tsx` | Update `handleCreateCodes` to pass new fields through to mutation. Add "Grants" column to table. |

## What Already Works (No Changes Needed)

- `createInviteCode()` in `services/bootcamp-supabase.ts` — accepts `accessLevel`, `toolGrants`, `contentGrants`, `customCode`
- `useCreateInviteCodeMutation()` in `hooks/useBootcampAdminMutations.ts` — passes all fields through
- `registerBootcampStudent()` — reads `tool_grants` from code and grants credits
- `redeemCode()` — reads `tool_grants` and grants on redemption
- Database schema — `bootcamp_invite_codes` has `tool_grants`, `access_level`, `content_grants` columns
