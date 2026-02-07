import { supabase } from '../lib/supabaseClient';
import {
  InfraTier,
  InfraProvision,
  InfraDomain,
  InfraProvisionWithDetails,
  ProvisioningStep,
} from '../types/infrastructure-types';

// ============================================
// Mappers
// ============================================

function mapTier(data: Record<string, unknown>): InfraTier {
  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    domainCount: data.domain_count as number,
    mailboxesPerDomain: data.mailboxes_per_domain as number,
    setupFeeCents: data.setup_fee_cents as number,
    monthlyFeeCents: data.monthly_fee_cents as number,
    stripeSetupPriceId: data.stripe_setup_price_id as string | null,
    stripeMonthlyPriceId: data.stripe_monthly_price_id as string | null,
    isActive: data.is_active as boolean,
    sortOrder: data.sort_order as number,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapProvision(data: Record<string, unknown>): InfraProvision {
  return {
    id: data.id as string,
    studentId: data.student_id as string,
    tierId: data.tier_id as string,
    status: data.status as InfraProvision['status'],
    stripeCheckoutSessionId: data.stripe_checkout_session_id as string | null,
    stripeSubscriptionId: data.stripe_subscription_id as string | null,
    stripeCustomerId: data.stripe_customer_id as string | null,
    mailboxPattern1: data.mailbox_pattern_1 as string,
    mailboxPattern2: data.mailbox_pattern_2 as string,
    zapmailWorkspaceId: data.zapmail_workspace_id as string | null,
    plusvibeWorkspaceId: data.plusvibe_workspace_id as string | null,
    plusvibeClientId: data.plusvibe_client_id as string | null,
    plusvibeClientEmail: data.plusvibe_client_email as string | null,
    heyreachListId: data.heyreach_list_id as number | null,
    provisioningLog: (data.provisioning_log as ProvisioningStep[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapDomain(data: Record<string, unknown>): InfraDomain {
  return {
    id: data.id as string,
    provisionId: data.provision_id as string,
    domainName: data.domain_name as string,
    zapmailDomainId: data.zapmail_domain_id as string | null,
    status: data.status as InfraDomain['status'],
    mailboxes: (data.mailboxes as InfraDomain['mailboxes']) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// ============================================
// Queries
// ============================================

export async function fetchActiveTiers(): Promise<InfraTier[]> {
  const { data, error } = await supabase
    .from('infra_tiers')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTier);
}

// Explicit columns — excludes sensitive fields (zapmail_workspace_key, plusvibe_client_password)
const PROVISION_COLUMNS = `
  id, student_id, tier_id, status,
  stripe_checkout_session_id, stripe_subscription_id, stripe_customer_id,
  mailbox_pattern_1, mailbox_pattern_2,
  zapmail_workspace_id, plusvibe_workspace_id, plusvibe_client_id,
  plusvibe_client_email, heyreach_list_id,
  provisioning_log, created_at, updated_at,
  infra_tiers(*), infra_domains(*)
`;

export async function fetchProvisionByStudentId(
  studentId: string
): Promise<InfraProvisionWithDetails | null> {
  const { data, error } = await supabase
    .from('infra_provisions')
    .select(PROVISION_COLUMNS)
    .eq('student_id', studentId)
    .single();

  if (error || !data) return null;

  const provision = mapProvision(data);
  const tier = mapTier(data.infra_tiers as unknown as Record<string, unknown>);
  const domains = ((data.infra_domains || []) as unknown as Record<string, unknown>[]).map(
    mapDomain
  );

  return { ...provision, tier, domains };
}

export async function fetchProvisioningLog(provisionId: string): Promise<ProvisioningStep[]> {
  const { data, error } = await supabase
    .from('infra_provisions')
    .select('provisioning_log')
    .eq('id', provisionId)
    .single();

  if (error || !data) return [];
  return (data.provisioning_log as ProvisioningStep[]) || [];
}

// ============================================
// Mutations
// ============================================

export async function createProvision(input: {
  studentId: string;
  tierId: string;
  mailboxPattern1: string;
  mailboxPattern2: string;
}): Promise<InfraProvision> {
  const { data, error } = await supabase
    .from('infra_provisions')
    .insert({
      student_id: input.studentId,
      tier_id: input.tierId,
      mailbox_pattern_1: input.mailboxPattern1,
      mailbox_pattern_2: input.mailboxPattern2,
      status: 'pending_payment',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProvision(data);
}
