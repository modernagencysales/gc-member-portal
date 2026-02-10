// ============================================
// GTM Infrastructure Types
// ============================================

export type ProductType = 'email_infra' | 'outreach_tools';

export interface InfraTier {
  id: string;
  name: string;
  slug: string;
  domainCount: number;
  mailboxesPerDomain: number;
  setupFeeCents: number;
  monthlyFeeCents: number;
  stripeSetupPriceId: string | null;
  stripeMonthlyPriceId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachPricing {
  id: string;
  setupFeeCents: number;
  monthlyFeeCents: number;
  stripeSetupPriceId: string | null;
  stripeMonthlyPriceId: string | null;
  isActive: boolean;
}

export type ProvisionStatus =
  | 'pending_payment'
  | 'provisioning'
  | 'active'
  | 'failed'
  | 'cancelled'
  | 'upgrading';

export type ServiceProvider = 'GOOGLE' | 'MICROSOFT';

export interface InfraProvision {
  id: string;
  studentId: string;
  productType: ProductType;
  tierId: string | null;
  status: ProvisionStatus;
  serviceProvider: ServiceProvider;
  stripeCheckoutSessionId: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  mailboxPattern1: string | null;
  mailboxPattern2: string | null;
  linkedProvisionId: string | null;
  zapmailWorkspaceId: string | null;
  plusvibeWorkspaceId: string | null;
  plusvibeClientId: string | null;
  plusvibeClientEmail: string | null;
  heyreachListId: number | null;
  provisioningLog: ProvisioningStep[];
  createdAt: string;
  updatedAt: string;
}

export type DomainStatus =
  | 'pending'
  | 'purchasing'
  | 'dns_pending'
  | 'connected'
  | 'active'
  | 'failed';

export interface DomainMailbox {
  username: string;
  email: string;
  zapmailMailboxId?: string;
  plusvibeAccountId?: string;
}

export interface InfraDomain {
  id: string;
  provisionId: string;
  domainName: string;
  zapmailDomainId: string | null;
  serviceProvider: ServiceProvider;
  status: DomainStatus;
  mailboxes: DomainMailbox[];
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningStep {
  step: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// Wizard state
export interface WizardState {
  step: number;
  selectedProducts: ProductType[];
  selectedTier: InfraTier | null;
  selectedDomains: DomainAvailability[];
  serviceProvider: ServiceProvider;
  mailboxPattern1: string;
  mailboxPattern2: string;
}

export interface DomainAvailability {
  domainName: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  domainPrice: number;
  renewPrice: number;
  serviceProvider: ServiceProvider;
}

// Provision with related data (for dashboard)
export interface InfraProvisionWithDetails extends InfraProvision {
  tier: InfraTier | null;
  domains: InfraDomain[];
}

// Both provisions for a student
export interface StudentProvisions {
  emailInfra: InfraProvisionWithDetails | null;
  outreachTools: InfraProvisionWithDetails | null;
}
