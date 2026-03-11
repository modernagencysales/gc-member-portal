/**
 * Subscription Supabase Service. Manages bootcamp student cohort memberships, Stripe
 * subscription events, and Stripe checkout session creation for bootcamp billing.
 * Constraint: Never imports React components or UI elements.
 */

import { supabase } from '../lib/supabaseClient';
import {
  SubscriptionStatus,
  StudentCohort,
  SubscriptionEvent,
  StudentCohortRole,
} from '../types/bootcamp-types';

const MEMBERS_COHORT_ID = '00000000-0000-0000-0000-000000000002';

// Fetch student's cohort memberships
export async function fetchStudentCohorts(studentId: string): Promise<StudentCohort[]> {
  const { data, error } = await supabase
    .from('student_cohorts')
    .select('student_id, cohort_id, role, joined_at')
    .eq('student_id', studentId);

  if (error) throw error;

  return (data || []).map(
    (row: {
      student_id: string;
      cohort_id: string;
      role: StudentCohortRole;
      joined_at: string;
    }) => ({
      studentId: row.student_id,
      cohortId: row.cohort_id,
      role: row.role,
      joinedAt: new Date(row.joined_at),
    })
  );
}

// Add student to a cohort
export async function addStudentToCohort(
  studentId: string,
  cohortId: string,
  role: 'student' | 'member' | 'resources'
): Promise<void> {
  const { error } = await supabase.from('student_cohorts').upsert({
    student_id: studentId,
    cohort_id: cohortId,
    role,
    joined_at: new Date().toISOString(),
  });

  if (error) throw error;
}

// Add student to Members cohort (for subscribers)
export async function addStudentToMembersCohort(studentId: string): Promise<void> {
  await addStudentToCohort(studentId, MEMBERS_COHORT_ID, 'member');
}

// Update student subscription status
export async function updateSubscriptionStatus(
  studentId: string,
  status: SubscriptionStatus,
  data?: {
    subscriptionId?: string;
    stripeCustomerId?: string;
    subscriptionStartedAt?: Date;
    subscriptionEndsAt?: Date;
  }
): Promise<void> {
  const updates: Record<string, unknown> = {
    subscription_status: status,
    updated_at: new Date().toISOString(),
  };

  if (data?.subscriptionId) updates.subscription_id = data.subscriptionId;
  if (data?.stripeCustomerId) updates.stripe_customer_id = data.stripeCustomerId;
  if (data?.subscriptionStartedAt)
    updates.subscription_started_at = data.subscriptionStartedAt.toISOString();
  if (data?.subscriptionEndsAt)
    updates.subscription_ends_at = data.subscriptionEndsAt.toISOString();

  const { error } = await supabase.from('bootcamp_students').update(updates).eq('id', studentId);

  if (error) throw error;
}

// Log subscription event
export async function logSubscriptionEvent(
  studentId: string,
  eventType: SubscriptionEvent['eventType'],
  stripeEventId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('subscription_events').insert({
    student_id: studentId,
    event_type: eventType,
    stripe_event_id: stripeEventId,
    metadata: metadata || {},
  });

  if (error) throw error;
}

// Get student by Stripe customer ID
export async function getStudentByStripeCustomerId(
  stripeCustomerId: string
): Promise<{ id: string; email: string } | null> {
  const { data, error } = await supabase
    .from('bootcamp_students')
    .select('id, email')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error) return null;
  return data;
}

// Get student by email
export async function getStudentByEmail(
  email: string
): Promise<{ id: string; email: string; stripeCustomerId?: string } | null> {
  const { data, error } = await supabase
    .from('bootcamp_students')
    .select('id, email, stripe_customer_id')
    .eq('email', email.toLowerCase())
    .single();

  if (error) return null;
  return {
    id: data.id,
    email: data.email,
    stripeCustomerId: data.stripe_customer_id,
  };
}

// ============================================
// Edge Function Wrappers
// ============================================

export async function createCheckoutSession(
  studentId: string,
  studentEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  return supabase.functions.invoke('create-checkout', {
    body: { studentId, studentEmail, successUrl, cancelUrl },
  });
}
