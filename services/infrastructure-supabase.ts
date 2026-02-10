import { supabase } from '../lib/supabaseClient';
import {
  InfraTier,
  InfraProvision,
  InfraDomain,
  InfraProvisionWithDetails,
  ProvisioningStep,
  OutreachPricing,
  StudentProvisions,
  ProductType,
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
    productType: (data.product_type as ProductType) || 'email_infra',
    tierId: (data.tier_id as string) || null,
    status: data.status as InfraProvision['status'],
    serviceProvider: (data.service_provider as InfraProvision['serviceProvider']) || 'GOOGLE',
    stripeCheckoutSessionId: data.stripe_checkout_session_id as string | null,
    stripeSubscriptionId: data.stripe_subscription_id as string | null,
    stripeCustomerId: data.stripe_customer_id as string | null,
    mailboxPattern1: (data.mailbox_pattern_1 as string) || null,
    mailboxPattern2: (data.mailbox_pattern_2 as string) || null,
    linkedProvisionId: (data.linked_provision_id as string) || null,
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
    serviceProvider: (data.service_provider as InfraDomain['serviceProvider']) || 'GOOGLE',
    status: data.status as InfraDomain['status'],
    mailboxes: (data.mailboxes as InfraDomain['mailboxes']) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapOutreachPricing(data: Record<string, unknown>): OutreachPricing {
  return {
    id: data.id as string,
    setupFeeCents: data.setup_fee_cents as number,
    monthlyFeeCents: data.monthly_fee_cents as number,
    stripeSetupPriceId: data.stripe_setup_price_id as string | null,
    stripeMonthlyPriceId: data.stripe_monthly_price_id as string | null,
    isActive: data.is_active as boolean,
  };
}

// ============================================
// Queries
// ============================================

export async function fetchActiveTiers(): Promise<InfraTier[]> {
  const { data, error } = await supabase
    .from('infra_tiers')
    .select(
      'id, name, slug, domain_count, mailboxes_per_domain, setup_fee_cents, monthly_fee_cents, stripe_setup_price_id, stripe_monthly_price_id, is_active, sort_order, created_at, updated_at'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapTier);
}

export async function fetchOutreachPricing(): Promise<OutreachPricing | null> {
  const { data, error } = await supabase
    .from('infra_outreach_pricing')
    .select(
      'id, setup_fee_cents, monthly_fee_cents, stripe_setup_price_id, stripe_monthly_price_id, is_active'
    )
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !data) return null;
  return mapOutreachPricing(data);
}

// Explicit columns — excludes sensitive fields (zapmail_workspace_key, plusvibe_client_password)
const PROVISION_COLUMNS = `
  id, student_id, product_type, tier_id, status, service_provider,
  stripe_checkout_session_id, stripe_subscription_id, stripe_customer_id,
  mailbox_pattern_1, mailbox_pattern_2, linked_provision_id,
  zapmail_workspace_id, plusvibe_workspace_id, plusvibe_client_id,
  plusvibe_client_email, heyreach_list_id,
  provisioning_log, created_at, updated_at
`;

export async function fetchProvisionsByStudentId(studentId: string): Promise<StudentProvisions> {
  // Use RPC function (SECURITY DEFINER) to bypass RLS — bootcamp login has no Supabase Auth session
  const { data, error } = await supabase.rpc('get_student_provisions', {
    p_student_id: studentId,
  });

  if (error || !data) return { emailInfra: null, outreachTools: null };

  const rows = data as Record<string, unknown>[];
  const result: StudentProvisions = { emailInfra: null, outreachTools: null };

  for (const row of rows) {
    const provision = mapProvision(row);
    const tier = row.infra_tiers
      ? mapTier(row.infra_tiers as unknown as Record<string, unknown>)
      : null;
    const domains = ((row.infra_domains || []) as unknown as Record<string, unknown>[]).map(
      mapDomain
    );
    const withDetails: InfraProvisionWithDetails = { ...provision, tier, domains };

    if (provision.productType === 'email_infra') {
      result.emailInfra = withDetails;
    } else if (provision.productType === 'outreach_tools') {
      result.outreachTools = withDetails;
    }
  }

  return result;
}

// Keep backwards-compatible single provision fetch
export async function fetchProvisionByStudentId(
  studentId: string
): Promise<InfraProvisionWithDetails | null> {
  const provisions = await fetchProvisionsByStudentId(studentId);
  return provisions.emailInfra || provisions.outreachTools || null;
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
  productType: ProductType;
  tierId?: string;
  serviceProvider?: 'GOOGLE' | 'MICROSOFT';
  mailboxPattern1?: string;
  mailboxPattern2?: string;
  linkedProvisionId?: string;
}): Promise<InfraProvision> {
  const insertData: Record<string, unknown> = {
    student_id: input.studentId,
    product_type: input.productType,
    service_provider: input.serviceProvider || 'GOOGLE',
    status: 'pending_payment',
  };

  if (input.tierId) insertData.tier_id = input.tierId;
  if (input.mailboxPattern1) insertData.mailbox_pattern_1 = input.mailboxPattern1;
  if (input.mailboxPattern2) insertData.mailbox_pattern_2 = input.mailboxPattern2;
  if (input.linkedProvisionId) insertData.linked_provision_id = input.linkedProvisionId;

  const { data, error } = await supabase
    .from('infra_provisions')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProvision(data);
}
