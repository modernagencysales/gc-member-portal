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

/**
 * Look up a prospect by email (case-insensitive) and link it to the bootcamp student.
 * This is non-blocking: if the lookup or update fails, the error is logged
 * but the caller continues normally.
 */
async function linkProspectToStudent(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  studentEmail: string
): Promise<void> {
  try {
    // Look up prospect by email (case-insensitive) with status='complete'
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('id')
      .ilike('email', studentEmail)
      .eq('status', 'complete')
      .maybeSingle();

    if (prospectError) {
      console.error('Prospect lookup failed for email:', studentEmail, prospectError);
      return;
    }

    if (!prospect) {
      console.log(`No completed prospect found for email: ${studentEmail}`);
      return;
    }

    // Update the bootcamp_students record with the prospect_id
    const { error: linkError } = await supabase
      .from('bootcamp_students')
      .update({ prospect_id: prospect.id })
      .eq('id', studentId);

    if (linkError) {
      console.error('Failed to link prospect to student:', linkError);
      return;
    }

    console.log(`Linked prospect ${prospect.id} to student ${studentId} via email ${studentEmail}`);
  } catch (err) {
    // Non-blocking: log and swallow any unexpected errors
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error in linkProspectToStudent:', message);
  }
}

/**
 * Auto-create a bootcamp_students record from a Stripe checkout session
 * that originated from a Cal.com booking.
 *
 * Returns the new student ID, or null on failure.
 * This is idempotent: if a student with the same email already exists,
 * the existing record's ID is returned instead of creating a duplicate.
 */
async function autoCreateBootcampStudent(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
): Promise<string | null> {
  try {
    const email =
      session.customer_details?.email || session.customer_email || session.metadata?.attendee_email;

    if (!email) {
      console.error('No email found in checkout session for auto-enrollment');
      return null;
    }

    const name = session.metadata?.attendee_name || '';
    const firstName = session.metadata?.attendee_first_name || name.split(' ')[0] || '';
    const lastName =
      session.metadata?.attendee_last_name || name.split(' ').slice(1).join(' ') || '';

    // Check for existing student by email (idempotency)
    const { data: existingStudent } = await supabase
      .from('bootcamp_students')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingStudent) {
      console.log(`Existing bootcamp student found for email ${email}: ${existingStudent.id}`);
      return existingStudent.id;
    }

    // Create new bootcamp student record
    const { data: newStudent, error } = await supabase
      .from('bootcamp_students')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: name || `${firstName} ${lastName}`.trim(),
        subscription_status: 'pending', // Will be set to 'active' by caller
        stripe_customer_id: (session.customer as string) || null,
        enrollment_source: 'calcom_booking',
        enrollment_metadata: {
          calcom_booking_uid: session.metadata?.calcom_booking_uid,
          calcom_event_slug: session.metadata?.calcom_event_slug,
          stripe_session_id: session.id,
          auto_enrolled: true,
          enrolled_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to auto-create bootcamp student:', error);
      return null;
    }

    console.log(
      `Auto-created bootcamp student ${newStudent.id} for email ${email} from Cal.com booking`
    );

    // Non-blocking: attempt to link Blueprint prospect
    await linkProspectToStudent(supabase, newStudent.id, email);

    return newStudent.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error in autoCreateBootcampStudent:', message);
    return null;
  }
}

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
        let studentId = session.metadata?.student_id;
        const calcomBookingUid = session.metadata?.calcom_booking_uid;
        const isCalcomSource = session.metadata?.source === 'calcom_booking';

        // If no student_id but this came from a Cal.com booking, auto-create the student
        if (!studentId && isCalcomSource && calcomBookingUid) {
          console.log(`Auto-creating bootcamp student from Cal.com booking: ${calcomBookingUid}`);
          studentId = await autoCreateBootcampStudent(supabase, session);

          if (!studentId) {
            console.error('Failed to auto-create bootcamp student from Cal.com booking');
            break;
          }
        }

        if (!studentId) {
          console.error('No student_id in session metadata and not a Cal.com booking');
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
        const eventMetadata: Record<string, unknown> = { session_id: session.id };
        if (isCalcomSource) {
          eventMetadata.source = 'calcom_booking';
          eventMetadata.calcom_booking_uid = calcomBookingUid;
          eventMetadata.calcom_event_slug = session.metadata?.calcom_event_slug;
          eventMetadata.auto_created = !session.metadata?.student_id;
        }

        const { error: eventError } = await supabase.from('subscription_events').insert({
          student_id: studentId,
          event_type: 'created',
          stripe_event_id: event.id,
          metadata: eventMetadata,
        });

        if (eventError) {
          console.error('Failed to log subscription event:', eventError);
          // Don't throw - this is just logging
        }

        // Auto-link Blueprint prospect record by email (non-blocking)
        const checkoutEmail = session.customer_details?.email || session.customer_email;
        if (checkoutEmail) {
          await linkProspectToStudent(supabase, studentId, checkoutEmail);
        } else {
          // Fall back to fetching email from the student record
          const { data: studentRecord } = await supabase
            .from('bootcamp_students')
            .select('email')
            .eq('id', studentId)
            .maybeSingle();
          if (studentRecord?.email) {
            await linkProspectToStudent(supabase, studentId, studentRecord.email);
          } else {
            console.log('No email available for prospect linking, skipping');
          }
        }

        console.log(
          `Subscription created for student ${studentId}${isCalcomSource ? ' (via Cal.com booking)' : ''}`
        );
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

          // Auto-link Blueprint prospect record by email (non-blocking)
          // Useful when prospect record was created after initial enrollment
          const invoiceEmail = invoice.customer_email;
          if (invoiceEmail) {
            await linkProspectToStudent(supabase, student.id, invoiceEmail);
          } else {
            // Fall back to fetching email from the student record
            const { data: studentRecord } = await supabase
              .from('bootcamp_students')
              .select('email')
              .eq('id', student.id)
              .maybeSingle();
            if (studentRecord?.email) {
              await linkProspectToStudent(supabase, student.id, studentRecord.email);
            }
          }

          console.log(`Payment received for student ${student.id}`);

          // --- Affiliate Referral Tracking ---
          // Check if this student was referred by an affiliate
          const { data: referral } = await supabase
            .from('referrals')
            .select('id, affiliate_id, total_price, amount_paid, status')
            .eq('bootcamp_student_id', student.id)
            .in('status', ['enrolled', 'paying'])
            .maybeSingle();

          if (referral) {
            const newAmountPaid = (referral.amount_paid || 0) + (invoice.amount_paid || 0) / 100;
            const newStatus = newAmountPaid >= referral.total_price ? 'paid_in_full' : 'paying';

            await supabase
              .from('referrals')
              .update({
                amount_paid: newAmountPaid,
                status: newStatus,
                ...(newStatus === 'paid_in_full'
                  ? { paid_in_full_at: new Date().toISOString() }
                  : {}),
              })
              .eq('id', referral.id);

            console.log(
              `Updated referral ${referral.id}: $${newAmountPaid} paid, status: ${newStatus}`
            );

            // Trigger payout if paid in full
            if (newStatus === 'paid_in_full') {
              try {
                const payoutUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-affiliate-payout`;
                await fetch(payoutUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                  },
                  body: JSON.stringify({ referralId: referral.id }),
                });
                console.log(`Triggered payout for referral ${referral.id}`);
              } catch (payoutErr) {
                console.error('Failed to trigger payout:', payoutErr);
                // Non-blocking: payout can be retried manually from admin
              }
            }
          }
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
