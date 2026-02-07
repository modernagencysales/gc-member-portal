import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

// Validate required environment variables at startup
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provisionId, studentId, tierId } = await req.json();

    if (!provisionId || !studentId || !tierId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: provisionId, studentId, tierId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client with service role for DB access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Look up the infrastructure tier to get Stripe price IDs
    const { data: tier, error: tierError } = await supabase
      .from('infra_tiers')
      .select('id, slug, stripe_setup_price_id, stripe_monthly_price_id')
      .eq('id', tierId)
      .single();

    if (tierError || !tier) {
      console.error('Failed to look up infra tier:', tierError);
      return new Response(JSON.stringify({ error: 'Infrastructure tier not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!tier.stripe_setup_price_id || !tier.stripe_monthly_price_id) {
      return new Response(JSON.stringify({ error: 'Stripe prices not configured for this tier' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine redirect URLs from the request origin
    const origin = req.headers.get('origin') || 'https://modernagencysales.com';

    // Create Stripe Checkout Session with setup (one-time) + monthly (recurring) line items
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: tier.stripe_setup_price_id,
          quantity: 1,
        },
        {
          price: tier.stripe_monthly_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        provision_id: provisionId,
        student_id: studentId,
        tier_slug: tier.slug,
        type: 'infrastructure',
      },
      subscription_data: {
        metadata: {
          provision_id: provisionId,
          student_id: studentId,
          tier_slug: tier.slug,
          type: 'infrastructure',
        },
      },
      success_url: `${origin}/bootcamp?lesson=virtual:infrastructure-manager&provisioning=true`,
      cancel_url: `${origin}/bootcamp?lesson=virtual:infrastructure-manager`,
    });

    // Update the infra_provisions record with the checkout session ID
    const { error: updateError } = await supabase
      .from('infra_provisions')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', provisionId);

    if (updateError) {
      console.error('Failed to update infra_provisions with session ID:', updateError);
      // Don't fail the response -- the checkout session was already created
      // and the student can still complete payment
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Infrastructure checkout error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
