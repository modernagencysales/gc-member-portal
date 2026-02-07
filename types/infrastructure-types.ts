// ============================================
// GTM Infrastructure Types
// ============================================

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

export type ProvisionStatus =
  | 'pending_payment'
  | 'provisioning'
  | 'active'
  | 'failed'
  | 'cancelled'
  | 'upgrading';

export interface InfraProvision {
  id: string;
  studentId: string;
  tierId: string;
  status: ProvisionStatus;
  stripeCheckoutSessionId: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  mailboxPattern1: string;
  mailboxPattern2: string;
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
  status: DomainStatus;
  mailboxes: DomainMailbox[];
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningStep {
  step: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// Wizard state
export interface WizardState {
  step: number;
  selectedTier: InfraTier | null;
  selectedDomains: DomainAvailability[];
  mailboxPattern1: string;
  mailboxPattern2: string;
}

export interface DomainAvailability {
  domainName: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  domainPrice: number;
  renewPrice: number;
}

// Provision with related data (for dashboard)
export interface InfraProvisionWithDetails extends InfraProvision {
  tier: InfraTier;
  domains: InfraDomain[];
}
