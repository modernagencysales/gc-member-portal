import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
        'Helicone-Property-Caller': 'generate-icp',
      }),
    };

    const { companyName, website, existingData } = await req.json();

    if (!companyName) {
      return new Response(JSON.stringify({ error: 'Missing companyName' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const existingContext = existingData
      ? `
The user has already provided some information:
- Target Description: ${existingData.targetDescription || 'Not provided'}
- Verticals: ${existingData.verticals || 'Not provided'}
- Offer: ${existingData.offer || 'Not provided'}

Use this to inform and enhance your suggestions.
`
      : '';

    const prompt = `You are an expert B2B sales strategist helping define an Ideal Customer Profile (ICP).

Company: ${companyName}
${website ? `Website: ${website}` : ''}
${existingContext}

Generate a comprehensive ICP profile. Return a JSON object with these exact keys:
- targetDescription: A 2-3 sentence description of the ideal customer
- verticals: Comma-separated list of 3-5 target industries/verticals
- companySize: Employee count range and/or revenue range
- jobTitles: Comma-separated list of 4-6 decision-maker titles
- geography: Target geographic regions
- painPoints: 3-4 specific pain points the ideal customer faces (bullet points)
- offer: A compelling one-sentence value proposition
- differentiator: 2-3 key differentiators that set this company apart
- socialProof: Suggested types of social proof to collect (case studies, metrics, etc.)
- commonObjections: 3-4 likely objections and brief handling strategies

Make the suggestions specific, actionable, and tailored to B2B outbound sales.
Return ONLY valid JSON, no markdown or explanation.`;

    const claudeResponse = await fetch(anthropicUrl, {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    const result = await claudeResponse.json();
    const text = result.content?.[0]?.text || '{}';

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleanedText);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('ICP generation error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
