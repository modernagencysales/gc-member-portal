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
 * Look up a cohort by its ThriveCart product ID.
 * Returns the cohort_id if found, null otherwise.
 */
async function lookupCohortByProductId(
  supabase: ReturnType<typeof createClient>,
  productId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('lms_cohorts')
    .select('id')
    .eq('thrivecart_product_id', productId)
    .single();

  if (error || !data) return null;
  return data.id;
}

/**
 * Enroll a student in a cohort via student_cohorts (idempotent upsert).
 */
async function enrollInCohort(
  supabase: ReturnType<typeof createClient>,
  studentId: string,
  cohortId: string,
  opts: {
    role?: string;
    accessLevel?: string;
    enrollmentSource?: string;
    enrollmentMetadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const { error } = await supabase.from('student_cohorts').upsert(
    {
      student_id: studentId,
      cohort_id: cohortId,
      role: opts.role || 'student',
      access_level: opts.accessLevel || 'Full Access',
      enrollment_source: opts.enrollmentSource,
      enrollment_metadata: opts.enrollmentMetadata || {},
      joined_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,cohort_id' }
  );

  if (error) {
    console.error('Failed to enroll student in cohort:', error);
  }
}

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

        // If this is a ThriveCart course purchase with a product_id, map to cohort
        const isThrivecartCourse =
          session.metadata?.source === 'thrivecart' &&
          session.metadata?.product_id &&
          session.metadata?.product_type !== 'funnel_access';

        if (!studentId && isThrivecartCourse) {
          const productId = session.metadata!.product_id!;
          const courseEmail = session.customer_details?.email || session.customer_email;

          if (!courseEmail) {
            console.error('No email in ThriveCart course session');
            break;
          }

          // Look up cohort by product ID
          const cohortId = await lookupCohortByProductId(supabase, productId);
          if (!cohortId) {
            console.error(`No cohort found for ThriveCart product_id: ${productId}`);
            break;
          }

          const courseName = session.customer_details?.name || '';
          const durationDays = session.metadata?.access_duration_days
            ? parseInt(session.metadata.access_duration_days, 10)
            : undefined;

          // Find or create student
          const { data: existingStudent } = await supabase
            .from('bootcamp_students')
            .select('id')
            .ilike('email', courseEmail)
            .maybeSingle();

          if (existingStudent) {
            studentId = existingStudent.id;
          } else {
            const { data: newStudent, error: createErr } = await supabase
              .from('bootcamp_students')
              .insert({
                email: courseEmail,
                full_name: courseName,
                access_level: 'Full Access',
                enrollment_source: 'thrivecart_course',
                enrollment_metadata: {
                  stripe_session_id: session.id,
                  product_id: productId,
                  enrolled_at: new Date().toISOString(),
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (createErr) {
              console.error('Failed to create student for course purchase:', createErr);
              break;
            }
            studentId = newStudent.id;
            await linkProspectToStudent(supabase, studentId!, courseEmail);
          }

          // Enroll in the cohort
          await enrollInCohort(supabase, studentId!, cohortId, {
            role: 'student',
            accessLevel: 'Full Access',
            enrollmentSource: 'thrivecart_course',
            enrollmentMetadata: {
              stripe_session_id: session.id,
              product_id: productId,
              ...(durationDays ? { access_duration_days: durationDays } : {}),
            },
          });

          // Log subscription event
          await supabase.from('subscription_events').insert({
            student_id: studentId,
            event_type: 'created',
            stripe_event_id: event.id,
            metadata: {
              session_id: session.id,
              source: 'thrivecart_course',
              product_id: productId,
              cohort_id: cohortId,
            },
          });

          console.log(
            `ThriveCart course enrollment complete: student ${studentId} → cohort ${cohortId}`
          );
          break;
        }

        // If this is a ThriveCart funnel access purchase, handle separately
        const isThrivecartFunnel =
          session.metadata?.source === 'thrivecart' &&
          session.metadata?.product_type === 'funnel_access';

        if (!studentId && isThrivecartFunnel) {
          const funnelEmail = session.customer_details?.email || session.customer_email;

          if (!funnelEmail) {
            console.error('No email in ThriveCart funnel session');
            break;
          }

          const funnelName = session.customer_details?.name || '';
          const durationDays = parseInt(session.metadata?.access_duration_days || '30', 10);
          const toolPreset = session.metadata?.tool_preset || 'default';

          // Idempotency: check for existing student
          const { data: existingFunnelStudent } = await supabase
            .from('bootcamp_students')
            .select('id, access_level')
            .ilike('email', funnelEmail)
            .maybeSingle();

          if (existingFunnelStudent) {
            console.log(
              `Existing student found for funnel email ${funnelEmail}: ${existingFunnelStudent.id}`
            );

            // If already has higher access, don't downgrade
            if (existingFunnelStudent.access_level === 'Full Access') {
              console.log('Student already has Full Access, skipping funnel downgrade');
              break;
            }

            // Update expiry for existing Funnel Access student
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);
            await supabase
              .from('bootcamp_students')
              .update({
                access_level: 'Funnel Access',
                access_expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingFunnelStudent.id);

            studentId = existingFunnelStudent.id;
          } else {
            // Create new Funnel Access student
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            const { data: newFunnelStudent, error: createError } = await supabase
              .from('bootcamp_students')
              .insert({
                email: funnelEmail,
                full_name: funnelName,
                access_level: 'Funnel Access',
                access_expires_at: expiresAt.toISOString(),
                enrollment_source: 'thrivecart_funnel',
                enrollment_metadata: {
                  stripe_session_id: session.id,
                  access_duration_days: durationDays,
                  tool_preset: toolPreset,
                  enrolled_at: new Date().toISOString(),
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (createError) {
              console.error('Failed to create funnel access student:', createError);
              break;
            }

            studentId = newFunnelStudent.id;
            console.log(
              `Created Funnel Access student ${studentId} for ${funnelEmail} (${durationDays} days)`
            );
          }

          // Grant tools from preset
          try {
            const { data: presetSetting } = await supabase
              .from('bootcamp_settings')
              .select('value')
              .eq('key', 'funnel_tool_presets')
              .single();

            const presets = presetSetting?.value as Record<string, { toolSlugs?: string[] }> | null;
            const preset = presets?.[toolPreset] || presets?.['default'];
            const toolSlugs = preset?.toolSlugs || [];

            if (toolSlugs.length > 0) {
              // Lookup tool IDs by slug
              const { data: tools } = await supabase
                .from('ai_tools')
                .select('id, slug')
                .in('slug', toolSlugs);

              if (tools && tools.length > 0) {
                const creditGrants = tools.map((t) => ({
                  student_id: studentId!,
                  tool_id: t.id,
                  credits_total: 999999, // Effectively unlimited during access window
                  credits_used: 0,
                  source: 'funnel_access',
                }));

                await supabase.from('student_tool_credits').insert(creditGrants);
                console.log(`Granted ${tools.length} tools to funnel student ${studentId}`);
              }
            }
          } catch (presetErr) {
            console.error('Failed to grant funnel tool presets (non-blocking):', presetErr);
          }

          // Non-blocking: link Blueprint prospect
          await linkProspectToStudent(supabase, studentId!, funnelEmail);

          // Log subscription event
          await supabase.from('subscription_events').insert({
            student_id: studentId,
            event_type: 'created',
            stripe_event_id: event.id,
            metadata: {
              session_id: session.id,
              source: 'thrivecart_funnel',
              access_duration_days: durationDays,
              tool_preset: toolPreset,
            },
          });

          console.log(`Funnel access enrollment complete for student ${studentId}`);
          break;
        }

        // Handle infrastructure provisioning checkout
        const isInfrastructure = session.metadata?.type === 'infrastructure';
        if (isInfrastructure) {
          const provisionId = session.metadata?.provision_id;
          if (!provisionId) {
            console.error('Infrastructure checkout missing provision_id in metadata');
            break;
          }

          // Update provision record with Stripe details and set status to provisioning
          const { error: infraUpdateError } = await supabase
            .from('infra_provisions')
            .update({
              status: 'provisioning',
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString(),
            })
            .eq('id', provisionId);

          if (infraUpdateError) {
            console.error('Failed to update infra provision:', infraUpdateError);
            throw new Error(`Failed to update infra provision: ${infraUpdateError.message}`);
          }

          // Trigger provisioning via gtm-system API
          const gtmSystemUrl = Deno.env.get('GTM_SYSTEM_URL') || 'https://gtmconductor.com';
          try {
            const triggerRes = await fetch(`${gtmSystemUrl}/api/infrastructure/provision`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': Deno.env.get('GTM_SYSTEM_API_KEY') || '',
              },
              body: JSON.stringify({
                provisionId,
                studentId: session.metadata?.student_id,
              }),
            });

            if (!triggerRes.ok) {
              const body = await triggerRes.text();
              console.error('Failed to trigger provisioning:', triggerRes.status, body);
              // Don't throw — provision status is already set, can be retried
            } else {
              console.log(`Provisioning triggered for provision ${provisionId}`);
            }
          } catch (triggerErr) {
            console.error('Error triggering provisioning (non-blocking):', triggerErr);
          }

          // Log subscription event
          if (session.metadata?.student_id) {
            await supabase.from('subscription_events').insert({
              student_id: session.metadata.student_id,
              event_type: 'created',
              stripe_event_id: event.id,
              metadata: {
                session_id: session.id,
                source: 'infrastructure',
                provision_id: provisionId,
                tier_slug: session.metadata?.tier_slug,
              },
            });
          }

          console.log(`Infrastructure checkout completed for provision ${provisionId}`);
          break;
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

        // Add to cohort — use product_id mapping if available, fall back to Members cohort
        let enrollCohortId = MEMBERS_COHORT_ID;
        if (session.metadata?.product_id) {
          const mappedCohort = await lookupCohortByProductId(supabase, session.metadata.product_id);
          if (mappedCohort) {
            enrollCohortId = mappedCohort;
          }
        }

        await enrollInCohort(supabase, studentId, enrollCohortId, {
          role: 'member',
          enrollmentSource: isCalcomSource ? 'calcom_booking' : 'stripe_subscription',
        });

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
