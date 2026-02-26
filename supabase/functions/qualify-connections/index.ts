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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const heliconeKey = Deno.env.get('HELICONE_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const anthropicUrl = heliconeKey
      ? 'https://anthropic.helicone.ai/v1/messages'
      : 'https://api.anthropic.com/v1/messages';
    const anthropicHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      ...(heliconeKey && {
        'Helicone-Auth': `Bearer ${heliconeKey}`,
        'Helicone-Property-Source': 'copy-of-gtm-os',
        'Helicone-Property-Caller': 'qualify-connections',
      }),
    };

    const { connections, criteria } = await req.json();

    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or empty connections array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const connectionsList = connections
      .map(
        (
          c: { firstName: string; lastName: string; company: string; position: string },
          i: number
        ) => `${i}. ${c.firstName} ${c.lastName} | Company: ${c.company} | Position: ${c.position}`
      )
      .join('\n');

    const criteriaText = [
      criteria.targetTitles?.length ? `Target titles: ${criteria.targetTitles.join(', ')}` : '',
      criteria.targetIndustries?.length
        ? `Target industries/company types: ${criteria.targetIndustries.join(', ')}`
        : '',
      criteria.freeTextDescription ? `Additional context: ${criteria.freeTextDescription}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `You are a lead qualification assistant. Given ICP criteria and a batch of LinkedIn connections, classify each as qualified or not_qualified.

## ICP Criteria
${criteriaText}

## Connections
${connectionsList}

## Instructions
For each connection, determine if they match the ICP criteria based on their title and company. Use your knowledge of well-known companies to inform your decisions. For unknown companies, make your best judgment based on the company name and the person's title.

Return a JSON array with one object per connection, in the same order:
[
  { "index": 0, "qualification": "qualified", "confidence": "high", "reasoning": "Brief reason" },
  ...
]

qualification: "qualified" or "not_qualified"
confidence: "high" (clear match/non-match), "medium" (likely but uncertain), "low" (guessing)
reasoning: One sentence explaining why.

Return ONLY valid JSON, no markdown or explanation.`;

    const claudeResponse = await fetch(anthropicUrl, {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    const result = await claudeResponse.json();
    const text = result.content?.[0]?.text || '[]';

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleanedText);

    return new Response(JSON.stringify({ results: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Connection qualification error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
