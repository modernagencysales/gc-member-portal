import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

// Validate required environment variables at startup
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const MEMBERS_COHORT_ID = '00000000-0000-0000-0000-000000000002';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const studentId = session.metadata?.student_id;

        if (!studentId) {
          console.error('No student_id in session metadata');
          break;
        }

        // Update student subscription status
        const { error: updateError } = await supabase
          .from('bootcamp_students')
          .update({
            subscription_status: 'active',
            subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            subscription_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', studentId);

        if (updateError) {
          console.error('Failed to update student subscription:', updateError);
          throw new Error(`Failed to update student: ${updateError.message}`);
        }

        // Add to Members cohort
        const { error: cohortError } = await supabase.from('student_cohorts').upsert({
          student_id: studentId,
          cohort_id: MEMBERS_COHORT_ID,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

        if (cohortError) {
          console.error('Failed to add student to Members cohort:', cohortError);
          // Don't throw - student is subscribed, just missing cohort access
        }

        // Log event
        const { error: eventError } = await supabase.from('subscription_events').insert({
          student_id: studentId,
          event_type: 'created',
          stripe_event_id: event.id,
          metadata: { session_id: session.id },
        });

        if (eventError) {
          console.error('Failed to log subscription event:', eventError);
          // Don't throw - this is just logging
        }

        console.log(`Subscription created for student ${studentId}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: student, error: fetchError } = await supabase
          .from('bootcamp_students')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (fetchError) {
          console.error('Failed to fetch student by customer ID:', fetchError);
          break;
        }

        if (student) {
          const { error: updateError } = await supabase
            .from('bootcamp_students')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', student.id);

          if (updateError) {
            console.error('Failed to update student status:', updateError);
            throw new Error(`Failed to update student: ${updateError.message}`);
          }

          await supabase.from('subscription_events').insert({
            student_id: student.id,
            event_type: 'paid',
            stripe_event_id: event.id,
            metadata: { invoice_id: invoice.id, amount: invoice.amount_paid },
          });

          console.log(`Payment received for student ${student.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: student, error: fetchError } = await supabase
          .from('bootcamp_students')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (fetchError) {
          console.error('Failed to fetch student by customer ID:', fetchError);
          break;
        }

        if (student) {
          const { error: updateError } = await supabase
            .from('bootcamp_students')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', student.id);

          if (updateError) {
            console.error('Failed to update student status:', updateError);
            throw new Error(`Failed to update student: ${updateError.message}`);
          }

          await supabase.from('subscription_events').insert({
            student_id: student.id,
            event_type: 'payment_failed',
            stripe_event_id: event.id,
            metadata: { invoice_id: invoice.id },
          });

          console.log(`Payment failed for student ${student.id}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: student, error: fetchError } = await supabase
          .from('bootcamp_students')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (fetchError) {
          console.error('Failed to fetch student by customer ID:', fetchError);
          break;
        }

        if (student) {
          const { error: updateError } = await supabase
            .from('bootcamp_students')
            .update({
              subscription_status: 'canceled',
              subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', student.id);

          if (updateError) {
            console.error('Failed to update student status:', updateError);
            throw new Error(`Failed to update student: ${updateError.message}`);
          }

          await supabase.from('subscription_events').insert({
            student_id: student.id,
            event_type: 'canceled',
            stripe_event_id: event.id,
            metadata: { subscription_id: subscription.id },
          });

          console.log(`Subscription canceled for student ${student.id}`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook handler error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
