import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ALLOWED_ORIGINS = [
  'https://modernagencysales.com',
  'https://www.modernagencysales.com',
  'http://localhost:3000',
  'http://localhost:5173',
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

interface ConnectionInput {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  position: string | null;
  deterministicScore: number;
}

interface Criteria {
  targetTitles?: string[];
  targetIndustries?: string[];
  freeTextDescription?: string;
}

interface AiResult {
  id: string;
  geographyScore: number;
  industryScore: number;
  seniorityScore: number;
  totalAiScore: number;
  geography: string;
  industry: string;
  companySize: string;
  reasoning: string;
  groundingData: {
    searchQueries?: string[];
    sourceUrls?: string[];
  };
  error?: string;
}

async function enrichConnection(
  conn: ConnectionInput,
  criteria: Criteria,
  apiKey: string
): Promise<AiResult> {
  const name = [conn.firstName, conn.lastName].filter(Boolean).join(' ') || 'Unknown';
  const company = conn.company || 'Unknown';
  const position = conn.position || 'Unknown';

  const criteriaText = [
    criteria.targetTitles?.length ? `Target titles: ${criteria.targetTitles.join(', ')}` : '',
    criteria.targetIndustries?.length
      ? `Target industries: ${criteria.targetIndustries.join(', ')}`
      : '',
    criteria.freeTextDescription ? `Context: ${criteria.freeTextDescription}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `Search the internet for this person and score them for ICP qualification.

Name: ${name}
Company: ${company}
Position: ${position}
Deterministic Score: ${conn.deterministicScore}/60

ICP:
${criteriaText}

Score on these dimensions:
1. Geography (0-15): Western world (US/UK/EU/Canada/Australia/NZ) = 15, likely Western = 10, uncertain = 5, non-Western = 0
2. Industry relevance (0-15): Strong ICP match = 15, moderate = 10, weak = 5, none = 0
3. Seniority confirmation (0-10): Confirmed decision-maker = 10, likely = 7, some signal = 3, none = 0

Return ONLY valid JSON:
{"geography_score":N,"industry_score":N,"seniority_score":N,"total_ai_score":N,"geography":"...","industry":"...","company_size":"...","reasoning":"..."}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { maxOutputTokens: 512 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return {
      id: conn.id,
      geographyScore: 0,
      industryScore: 0,
      seniorityScore: 0,
      totalAiScore: 0,
      geography: '',
      industry: '',
      companySize: '',
      reasoning: '',
      groundingData: {},
      error: `Gemini API error ${response.status}: ${errorText.substring(0, 200)}`,
    };
  }

  const data = await response.json();

  // Extract grounding metadata
  const groundingData: { searchQueries?: string[]; sourceUrls?: string[] } = {};
  const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
  if (groundingMetadata) {
    if (groundingMetadata.searchEntryPoint?.renderedContent) {
      groundingData.searchQueries = [groundingMetadata.searchEntryPoint.renderedContent];
    }
    if (groundingMetadata.groundingChunks) {
      groundingData.sourceUrls = groundingMetadata.groundingChunks
        .filter((c: { web?: { uri: string } }) => c.web?.uri)
        .map((c: { web: { uri: string } }) => c.web.uri);
    }
  }

  // Parse the response text
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    const geoScore = Math.min(15, Math.max(0, parsed.geography_score || 0));
    const indScore = Math.min(15, Math.max(0, parsed.industry_score || 0));
    const senScore = Math.min(10, Math.max(0, parsed.seniority_score || 0));

    return {
      id: conn.id,
      geographyScore: geoScore,
      industryScore: indScore,
      seniorityScore: senScore,
      totalAiScore: geoScore + indScore + senScore,
      geography: parsed.geography || '',
      industry: parsed.industry || '',
      companySize: parsed.company_size || '',
      reasoning: parsed.reasoning || '',
      groundingData,
    };
  } catch {
    return {
      id: conn.id,
      geographyScore: 0,
      industryScore: 0,
      seniorityScore: 0,
      totalAiScore: 0,
      geography: '',
      industry: '',
      companySize: '',
      reasoning: `Failed to parse Gemini response: ${cleaned.substring(0, 100)}`,
      groundingData,
      error: 'JSON parse failure',
    };
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const { connections, criteria } = await req.json();

    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or empty connections array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process connections sequentially (Gemini rate limits)
    const results: AiResult[] = [];
    for (const conn of connections) {
      const result = await enrichConnection(conn, criteria || {}, apiKey);
      results.push(result);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Connection enrichment error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
