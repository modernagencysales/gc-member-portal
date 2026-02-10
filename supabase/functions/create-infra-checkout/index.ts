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
    const { provisionId, outreachProvisionId, studentId, tierId, includeOutreach } =
      await req.json();

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'Missing required field: studentId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!provisionId && !outreachProvisionId) {
      return new Response(
        JSON.stringify({ error: 'At least one of provisionId or outreachProvisionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Build line items dynamically based on what's being purchased
    const lineItems: { price: string; quantity: number }[] = [];
    let tierSlug = '';

    // Email infra line items
    if (provisionId && tierId) {
      const { data: tier, error: tierError } = await supabase
        .from('infra_tiers')
        .select('id, slug, stripe_setup_price_id, stripe_monthly_price_id')
        .eq('id', tierId)
        .single();

      if (tierError || !tier) {
        return new Response(JSON.stringify({ error: 'Infrastructure tier not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!tier.stripe_setup_price_id || !tier.stripe_monthly_price_id) {
        return new Response(
          JSON.stringify({ error: 'Stripe prices not configured for this tier' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      tierSlug = tier.slug;
      lineItems.push(
        { price: tier.stripe_setup_price_id, quantity: 1 },
        { price: tier.stripe_monthly_price_id, quantity: 1 }
      );
    }

    // Outreach tools line items
    if (outreachProvisionId || includeOutreach) {
      const { data: outreachPricing, error: outreachError } = await supabase
        .from('infra_outreach_pricing')
        .select('stripe_setup_price_id, stripe_monthly_price_id')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (outreachError || !outreachPricing) {
        return new Response(JSON.stringify({ error: 'Outreach pricing not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!outreachPricing.stripe_monthly_price_id) {
        return new Response(
          JSON.stringify({ error: 'Stripe monthly price not configured for outreach tools' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (outreachPricing.stripe_setup_price_id) {
        lineItems.push({ price: outreachPricing.stripe_setup_price_id, quantity: 1 });
      }
      lineItems.push({ price: outreachPricing.stripe_monthly_price_id, quantity: 1 });
    }

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No line items to checkout' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin') || 'https://modernagencysales.com';

    const metadata = {
      type: 'infrastructure',
      provision_id: provisionId || '',
      outreach_provision_id: outreachProvisionId || '',
      student_id: studentId,
      tier_slug: tierSlug || '',
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      metadata,
      subscription_data: { metadata },
      success_url: `${origin}/bootcamp?lesson=virtual:infrastructure-manager&provisioning=true`,
      cancel_url: `${origin}/bootcamp?lesson=virtual:infrastructure-manager`,
    });

    // Update provision records with checkout session ID
    if (provisionId) {
      await supabase
        .from('infra_provisions')
        .update({
          stripe_checkout_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', provisionId);
    }

    if (outreachProvisionId) {
      await supabase
        .from('infra_provisions')
        .update({
          stripe_checkout_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', outreachProvisionId);
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
