import { supabase } from '../lib/supabaseClient';
import { IntroOffer, IntroOfferDeliverable } from '../types/intro-offer-types';

// Column constants — must match DB schema in 20260214120000_intro_offers.sql
const OFFER_COLUMNS =
  'id, tenant_id, lead_id, prospect_id, status, stripe_checkout_session_id, amount_paid, discount_code, interview_data, magnetlab_user_id, heyreach_account_id, delivered_at, handed_off_at, notes, created_at, updated_at';

const DELIVERABLE_COLUMNS =
  'id, offer_id, type, status, title, delivery_order, metadata, started_at, completed_at, delivered_at, notes, error_message, created_at';

// ============================================
// Fetch functions (read from shared Supabase)
// ============================================

export async function fetchIntroOffers(): Promise<IntroOffer[]> {
  const { data, error } = await supabase
    .from('intro_offers')
    .select(OFFER_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data || []).map(mapOffer);
}

export async function fetchIntroOfferById(offerId: string): Promise<IntroOffer | null> {
  const { data, error } = await supabase
    .from('intro_offers')
    .select(OFFER_COLUMNS)
    .eq('id', offerId)
    .single();

  if (error || !data) return null;
  return mapOffer(data);
}

export async function fetchDeliverables(offerId: string): Promise<IntroOfferDeliverable[]> {
  const { data, error } = await supabase
    .from('intro_offer_deliverables')
    .select(DELIVERABLE_COLUMNS)
    .eq('offer_id', offerId)
    .order('delivery_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapDeliverable);
}

export async function fetchLeadName(leadId: string): Promise<string | null> {
  const { data } = await supabase
    .from('leads')
    .select('first_name, last_name, email')
    .eq('id', leadId)
    .single();

  if (!data) return null;
  const name = [data.first_name, data.last_name].filter(Boolean).join(' ');
  return name || (data.email as string) || null;
}

// ============================================
// Admin actions (call gtm-system API)
// ============================================

const GTM_API_BASE = import.meta.env.VITE_GTM_API_URL || 'https://gtmconductor.com';

async function gtmFetch(path: string, options: RequestInit = {}) {
  // Get current Supabase session token for authenticated API calls
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${GTM_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function submitInterview(offerId: string, interviewData: Record<string, unknown>) {
  return gtmFetch(`/api/intro-offers/${offerId}/interview`, {
    method: 'POST',
    body: JSON.stringify({ interview_data: interviewData }),
  });
}

export async function approveReview(offerId: string) {
  return gtmFetch(`/api/intro-offers/${offerId}/review`, {
    method: 'POST',
  });
}

export async function triggerHandoff(offerId: string) {
  return gtmFetch(`/api/intro-offers/${offerId}/handoff`, {
    method: 'POST',
  });
}

export async function retryDeliverable(offerId: string, deliverableId: string) {
  return gtmFetch(`/api/intro-offers/${offerId}/deliverables/${deliverableId}/retry`, {
    method: 'POST',
  });
}

// ============================================
// Mapping functions
// ============================================

function mapOffer(record: Record<string, unknown>): IntroOffer {
  return {
    id: record.id as string,
    tenantId: record.tenant_id as string,
    leadId: record.lead_id as string | null,
    prospectId: record.prospect_id as string | null,
    status: record.status as IntroOffer['status'],
    stripeCheckoutSessionId: record.stripe_checkout_session_id as string | null,
    amountPaid: record.amount_paid as number | null,
    discountCode: record.discount_code as string | null,
    interviewData: record.interview_data as Record<string, unknown> | null,
    magnetlabUserId: record.magnetlab_user_id as string | null,
    heyreachAccountId: record.heyreach_account_id as string | null,
    deliveredAt: record.delivered_at as string | null,
    handedOffAt: record.handed_off_at as string | null,
    notes: record.notes as string | null,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
  };
}

function mapDeliverable(record: Record<string, unknown>): IntroOfferDeliverable {
  return {
    id: record.id as string,
    offerId: record.offer_id as string,
    type: record.type as IntroOfferDeliverable['type'],
    status: record.status as IntroOfferDeliverable['status'],
    title: record.title as string,
    deliveryOrder: record.delivery_order as number,
    metadata: (record.metadata as Record<string, unknown>) || {},
    startedAt: record.started_at as string | null,
    completedAt: record.completed_at as string | null,
    deliveredAt: record.delivered_at as string | null,
    notes: record.notes as string | null,
    errorMessage: record.error_message as string | null,
    createdAt: record.created_at as string,
  };
}
