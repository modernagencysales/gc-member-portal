import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const TEAM_ID = 'c7f962be-0a7e-470b-9d61-ccf0808aaa7d';
const TRIAGE_STATE_ID = 'f2412f79-de1d-4cf5-a7ff-2e5f9308280a';

const REPO_NAME = 'gc-member-portal';
const REPO_URL = 'https://github.com/modernagencysales/gc-member-portal';

const LABELS = {
  bug: '46e41c8b-4582-484b-8b00-01c9c8d82dd3',
  feature: '5a97afe8-f69c-4828-acba-8bff6cb2586d',
  improvement: '9b52111a-b4ff-4088-9d7c-7d07b842a27c',
} as const;

const PRIORITY_MAP: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

const ALLOWED_ORIGINS = [
  'https://modernagencysales.com',
  'https://www.modernagencysales.com',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Cache the "Bootcamp" label ID
let bootcampLabelId: string | null = null;

async function getOrCreateLabel(
  apiKey: string,
  name: string,
  color: string
): Promise<string | null> {
  // Search for existing label
  const searchRes = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({
      query: `query { issueLabels(filter: { name: { eq: "${name}" }, team: { id: { eq: "${TEAM_ID}" } } }) { nodes { id } } }`,
    }),
  });
  const searchData = await searchRes.json();
  const existing = searchData?.data?.issueLabels?.nodes?.[0]?.id;
  if (existing) return existing;

  // Create label
  const createRes = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify({
      query: `mutation { issueLabelCreate(input: { name: "${name}", color: "${color}", teamId: "${TEAM_ID}" }) { success issueLabel { id } } }`,
    }),
  });
  const createData = await createRes.json();
  return createData?.data?.issueLabelCreate?.issueLabel?.id ?? null;
}

async function getBootcampLabelId(apiKey: string): Promise<string | null> {
  if (bootcampLabelId) return bootcampLabelId;
  const id = await getOrCreateLabel(apiKey, 'Bootcamp', '#8B5CF6');
  if (id) bootcampLabelId = id;
  return id;
}

// Cache "User Reported" label
let userReportedLabelId: string | null = null;

async function getUserReportedLabelId(apiKey: string): Promise<string | null> {
  if (userReportedLabelId) return userReportedLabelId;
  const id = await getOrCreateLabel(apiKey, 'User Reported', '#8B5CF6');
  if (id) userReportedLabelId = id;
  return id;
}

function getTypeLabel(type: string): string {
  if (type === 'bug') return LABELS.bug;
  if (type === 'feature') return LABELS.feature;
  return LABELS.improvement;
}

interface Metadata {
  url: string;
  userEmail: string | null;
  userId: string | null;
  browser: string;
  os: string;
  screenResolution: string;
  appName: string;
  appVersion: string;
  timestamp: string;
}

function buildDescription(userDescription: string, metadata: Metadata): string {
  return `${userDescription}

---

| Field | Value |
|-------|-------|
| **URL** | ${metadata.url || 'N/A'} |
| **Email** | ${metadata.userEmail || 'Anonymous'} |
| **User ID** | ${metadata.userId || 'N/A'} |
| **Browser** | ${metadata.browser} |
| **OS** | ${metadata.os} |
| **Screen** | ${metadata.screenResolution} |
| **App** | ${metadata.appName} v${metadata.appVersion} |
| **Repo** | [${REPO_NAME}](${REPO_URL}) |
| **Timestamp** | ${metadata.timestamp} |`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LINEAR_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Feedback system not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const { type, severity, title, description, metadata } = body;

    if (!title || !description || !type) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build label IDs
    const labelIds: string[] = [getTypeLabel(type)];

    const bootcampId = await getBootcampLabelId(apiKey);
    if (bootcampId) labelIds.push(bootcampId);

    const userReportedId = await getUserReportedLabelId(apiKey);
    if (userReportedId) labelIds.push(userReportedId);

    const priority = type === 'bug' && severity ? (PRIORITY_MAP[severity] ?? 0) : 0;
    const issueTitle = `[Bootcamp] ${title}`;
    const issueDescription = buildDescription(description, metadata || {});

    const mutation = `
      mutation CreateFeedbackIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier url }
        }
      }
    `;

    const res = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: apiKey },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            teamId: TEAM_ID,
            title: issueTitle,
            description: issueDescription,
            priority,
            stateId: TRIAGE_STATE_ID,
            labelIds,
          },
        },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      console.error('Linear API errors:', JSON.stringify(data.errors));
      return new Response(JSON.stringify({ success: false, error: 'Failed to create issue' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const issue = data.data?.issueCreate?.issue;
    if (!issue) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to create issue' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, issueId: issue.identifier, issueUrl: issue.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Feedback error:', message);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send feedback' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
