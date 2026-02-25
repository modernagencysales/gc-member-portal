# Profile Rewrite Review Gate & Slack Deep Link — Design

**Issue:** MOD-159 — Automated profile rewrite issue

## Problem

1. `ProfileRewriteCard` fetches automation output directly (no status check), so profile rewrite content is visible in the client portal the instant the automation completes — before admin QA.
2. Slack notifications link to the portal root, not the specific deliverable.

## Solution

### 1. Gate ProfileRewriteCard behind deliverable status

`ClientDashboard` currently renders `<ProfileRewriteCard>` unconditionally. Change it to only render when the profile_rewrite deliverable has status `review`, `approved`, or `completed`.

This requires passing deliverables from `ClientPortalPage` into `ClientDashboard` so it can check the status of the profile_rewrite deliverable.

### 2. Inline preview + modal in DeliverableCard

When a profile_rewrite deliverable is in `review` status, `DeliverableCard` shows:
- **Inline preview**: first headline option + truncated about section (2 lines)
- **"View Full Rewrite" button** → opens a modal with the full `ProfileRewriteCard` content

This requires:
- Adding `automation_type` to `DfyDeliverable` type and Supabase SELECT query
- A new `ProfileRewriteModal` component
- `DeliverableCard` fetching automation output when `automation_type === 'profile_rewrite'` and status is `review`/`approved`/`completed`

### 3. Deep link support in ClientPortalPage

Parse URL query params `?tab=deliverables&deliverable=<id>`:
- Auto-switch to Deliverables tab
- Auto-expand the targeted deliverable (pass `expandedId` prop to `DeliverableCard`)

### 4. Update Slack notification link (gtm-system)

In `src/app/api/dfy/admin/deliverables/[id]/route.ts`, change portalUrl from:
```
https://modernagencysales.com/client/{slug}
```
to:
```
https://modernagencysales.com/client/{slug}?tab=deliverables&deliverable={deliverableId}
```

## Repos

- **gc-member-portal** — Changes 1, 2, 3
- **gtm-system** — Change 4
