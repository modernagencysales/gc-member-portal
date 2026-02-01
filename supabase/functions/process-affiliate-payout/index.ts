import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is required');

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const { referralId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: referral, error: refError } = await supabase
      .from('referrals')
      .select('*, affiliates(*)')
      .eq('id', referralId)
      .single();

    if (refError || !referral) {
      throw new Error(`Referral not found: ${referralId}`);
    }

    const affiliate = referral.affiliates;
    if (!affiliate?.stripe_connect_account_id || !affiliate?.stripe_connect_onboarded) {
      console.error(`Affiliate ${affiliate?.id} not set up for payouts`);
      return new Response(JSON.stringify({ error: 'Affiliate not set up for payouts' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const commissionAmount = affiliate.commission_amount * 100;

    const { data: payout, error: payoutError } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id: affiliate.id,
        referral_id: referralId,
        amount: affiliate.commission_amount,
        status: 'processing',
      })
      .select()
      .single();

    if (payoutError) throw new Error(payoutError.message);

    const transfer = await stripe.transfers.create({
      amount: commissionAmount,
      currency: 'usd',
      destination: affiliate.stripe_connect_account_id,
      metadata: {
        affiliate_id: affiliate.id,
        referral_id: referralId,
        payout_id: payout.id,
      },
    });

    await supabase
      .from('affiliate_payouts')
      .update({
        stripe_transfer_id: transfer.id,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payout.id);

    await supabase
      .from('referrals')
      .update({
        status: 'commission_paid',
        commission_paid_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    console.log(`Payout of $${affiliate.commission_amount} sent to affiliate ${affiliate.id}`);

    return new Response(JSON.stringify({ success: true, transferId: transfer.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payout error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
