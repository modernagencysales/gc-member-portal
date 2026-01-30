# Intake API Documentation

API for submitting LinkedIn profiles to the Lead Magnet pipeline.

## Base URL

```
https://linkedin-leadmagnet-backend-production.up.railway.app
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/intake` | 10 requests | per minute per IP |

Rate limit headers included in responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Submit a Prospect

```
POST /api/intake
```

Submits a new LinkedIn profile to the pipeline. Returns immediately with a `prospect_id` — background processing (~12-15 min) runs asynchronously via Trigger.dev.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `linkedin_url` | string | **Yes** | LinkedIn profile URL |
| `full_name` | string | **Yes** | Person's full name |
| `email` | string | **Yes** | Email address for notifications |
| `company` | string | No | Company name |
| `business_type` | string | No | Coach, Consultant, Agency Owner, etc. |
| `monthly_income` | string | No | Approximate monthly business income (Under $5k, $5k-$10k, $10k-$30k, $30k-$50k, $50k-$100k, $100k+) |
| `linkedin_challenge` | string | No | Their main LinkedIn challenge |
| `linkedin_help_area` | string | No | What part of LinkedIn they need help with |
| `posting_frequency` | string | No | How often they post (Daily, Weekly, Never) |
| `has_funnel` | string | No | Whether they have a funnel set up (Yes, No) |
| `learning_investment` | string | No | How much invested in learning ($5k-$10k, etc.) |
| `interested_in_mas` | boolean | No | Interested in Modern Agency Sales (default: false) |
| `phone` | string | No | Phone number |
| `timezone` | string | No | Prospect's timezone |
| `source_url` | string | No | URL where the lead came from |
| `lead_magnet_source` | string | No | Lead magnet identifier (for tracking) |
| `send_email` | boolean | No | Send email notification when complete (default: true) |

### Responses

**200 OK** — Success (returned immediately)

```json
{
  "success": true,
  "prospect_id": "uuid-here",
  "report_url": "https://modernagencysales.com/blueprint?=uuid-here",
  "status": "pending_scrape",
  "message": "Prospect created and pipeline started"
}
```

**409 Conflict** — Duplicate

```json
{
  "error": "Prospect already exists",
  "existing_prospect_id": "uuid-here",
  "report_url": "https://modernagencysales.com/blueprint?=uuid-here"
}
```

**400 Bad Request** — Validation Error

```json
{
  "error": "Invalid LinkedIn URL format"
}
```

**429 Too Many Requests** — Rate Limited

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds."
}
```

---

## Poll for Status

```
GET /api/admin/prospect/:id
```

Check processing progress. Poll every 30-60 seconds until `status` is `complete` or `error`.

```json
{
  "success": true,
  "prospect": {
    "id": "uuid-here",
    "status": "enriching",
    "processing_step": "AI Enrichment",
    "authority_score": null,
    "report_url": "https://..."
  }
}
```

### Pipeline Stages

```
1. Scraping Profile → 2. Scraping Posts → 3. AI Enrichment → 4. Generating Posts → 5. Complete
```

AI Enrichment sub-steps: Company Research → Knowledge Base → Authority Scores → Strategic Analysis → Profile Rewrite → Action Plans → Format Report

Total processing time: ~12-15 minutes per prospect.

### Database Status Values

| Status | Processing Step | Meaning |
|--------|----------------|---------|
| `pending_scrape` | — | Waiting to start |
| `scraping_profile` | Scraping Profile | Apify scraping LinkedIn profile |
| `scraping_posts` | Scraping Posts | Apify scraping LinkedIn posts |
| `enriching` | AI Enrichment | Claude AI analyzing profile |
| `generating_posts` | Generating Posts | Creating 60 personalized posts |
| `complete` | — | All done, email sent |
| `error` | — | Failed (check `error_log`) |

---

## Retry Endpoints

```
POST /api/admin/retry/:id
```
Retry from a specific step. Body: `{"step": "scrape|enrichment|posts"}`

```
POST /api/admin/regenerate/:id
```
Delete all posts and regenerate from templates.

---

## Examples

### cURL

```bash
curl -X POST https://linkedin-leadmagnet-backend-production.up.railway.app/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Inc",
    "business_type": "Agency",
    "monthly_income": "$10k-$30k",
    "send_email": true
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch(
  'https://linkedin-leadmagnet-backend-production.up.railway.app/api/intake',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      linkedin_url: 'https://linkedin.com/in/johndoe',
      full_name: 'John Doe',
      email: 'john@example.com',
      business_type: 'Consultant',
      monthly_income: '$10k-$30k',
    }),
  }
);

const data = await response.json();
const prospectId = data.prospect_id;

// Poll for completion
const checkStatus = async () => {
  const statusRes = await fetch(
    `https://linkedin-leadmagnet-backend-production.up.railway.app/api/admin/prospect/${prospectId}`
  );
  const status = await statusRes.json();

  if (status.prospect.status === 'complete') {
    console.log('Done!', status.prospect.report_url);
    return status;
  } else if (status.prospect.status === 'error') {
    throw new Error(status.prospect.error_log);
  }

  // Still processing — check again in 30 seconds
  await new Promise((r) => setTimeout(r, 30000));
  return checkStatus();
};

await checkStatus();
```

### Python (requests)

```python
import requests

response = requests.post(
    'https://linkedin-leadmagnet-backend-production.up.railway.app/api/intake',
    json={
        'linkedin_url': 'https://linkedin.com/in/johndoe',
        'full_name': 'John Doe',
        'email': 'john@example.com',
        'business_type': 'Consultant',
        'monthly_income': '$10k-$30k',
    }
)

data = response.json()
print(data['prospect_id'])
```

### Zapier / Make / n8n

Use an HTTP/Webhook action:
- **Method:** POST
- **URL:** `https://linkedin-leadmagnet-backend-production.up.railway.app/api/intake`
- **Headers:** `Content-Type: application/json`
- **Body:** Map your form fields to the JSON body above

### Webflow Form Integration

1. In Webflow, select your form → Form Settings
2. Set Action to: `https://linkedin-leadmagnet-backend-production.up.railway.app/api/intake`
3. Set Method to: POST
4. Name form fields to match API fields: `linkedin_url` (required), `full_name` (required), `email` (required), plus optional fields
5. Publish

For better UX, use Zapier/Make to handle submission and show a custom success page.

---

## Backend Architecture (Trigger.dev)

```
POST /api/intake
  └── scrape-prospect (Trigger.dev task)
      ├── Scrape LinkedIn Profile (Apify)
      ├── Scrape LinkedIn Posts (Apify)
      └── enrich-prospect (Trigger.dev task)
          ├── Authority Scores (Claude AI)
          ├── Strategic Analysis (Claude AI)
          ├── Profile Rewrite (Claude AI)
          ├── Action Plans (Claude AI)
          ├── Format Report (Claude AI)
          └── generate-posts (Trigger.dev task)
              ├── Generate 60 posts in batches of 5
              └── send-notification (Trigger.dev task)
                  └── Email via Resend
```

### Trigger.dev Tasks

| Task ID | Purpose | Retries | Timeout |
|---------|---------|---------|---------|
| `scrape-prospect` | Full scrape pipeline (profile + posts) | 3 attempts | 2 min |
| `enrich-prospect` | 5-step AI enrichment | 5 attempts | 2 min |
| `generate-posts` | Generate 60 personalized posts | 3 attempts | 5 min |
| `send-notification` | Send email via Loops | 3 attempts | 30 sec |

---

## Environment Variables

```bash
# Required
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
APIFY_API_KEY=apify_api_...
TRIGGER_SECRET_KEY=tr_dev_...

# Optional
RESEND_API_KEY=...           # For email notifications
GEMINI_API_KEY=...           # Fallback AI provider
REPORT_URL=https://...       # Custom report base URL
LOG_LEVEL=debug              # Enable debug logging
```

## Troubleshooting

| Issue | Where to Check | Fix |
|-------|---------------|-----|
| Stuck at "Scraping Profile" | Trigger.dev `scrape-prospect` task | Apify rate limit or invalid URL. Use "Re-scrape" button. |
| Stuck at "AI Enrichment" | Trigger.dev `enrich-prospect` task | Claude API rate limit. Check `ANTHROPIC_API_KEY`. Use "Re-enrich" button. |
| Posts not generating | Trigger.dev `generate-posts` task | Verify templates exist. Use "Re-generate" button. |
| Email not sent | `email_sent_at` field in DB | Check `send_email` flag and `RESEND_API_KEY`. Check Trigger.dev `send-notification` task. |
