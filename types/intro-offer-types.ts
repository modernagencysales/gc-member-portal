// Intro Offer types — matches gtm-system intro_offers and intro_offer_deliverables tables

export type IntroOfferStatus =
  | 'created'
  | 'payment_received'
  | 'provisioning'
  | 'interview_pending'
  | 'fulfilling'
  | 'review'
  | 'delivered'
  | 'handed_off';

export type DeliverableType =
  | 'posts'
  | 'lead_magnet'
  | 'funnel'
  | 'heyreach_account'
  | 'heyreach_lists';

export type DeliverableStatus =
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'delivered'
  | 'error';

export interface IntroOffer {
  id: string;
  tenantId: string;
  leadId: string | null;
  prospectId: string | null;
  status: IntroOfferStatus;
  stripeCheckoutSessionId: string | null;
  amountPaid: number | null;
  discountCode: string | null;
  interviewData: Record<string, unknown> | null;
  magnetlabUserId: string | null;
  heyreachAccountId: string | null;
  deliveredAt: string | null;
  handedOffAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  leadName?: string;
  leadEmail?: string;
}

export interface IntroOfferDeliverable {
  id: string;
  offerId: string;
  type: DeliverableType;
  status: DeliverableStatus;
  title: string;
  deliveryOrder: number;
  metadata: Record<string, unknown>;
  startedAt: string | null;
  completedAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  errorMessage: string | null;
  createdAt: string;
}

// InterviewData schema — must match gtm-system src/lib/intro-offers/types.ts
export interface InterviewData {
  icp: {
    industry: string;
    company_size: string;
    job_titles: string[];
    pain_points: string[];
    buying_triggers: string[];
  };
  content: {
    key_topics: string[];
    client_stories: string[];
    tone_notes: string;
    avoid: string[];
  };
  lead_magnet: {
    preferred_archetype: string;
    topic_direction: string;
    existing_assets: string[];
  };
  outreach: {
    target_companies: string[];
    geographic_focus: string;
    exclusions: string[];
  };
}

// Display status for client-facing progress (simplified)
export type DisplayStatus = 'delivered' | 'in_progress' | 'pending';

// Status badge configuration
export const STATUS_CONFIGS: Record<string, { label: string; color: string }> = {
  created: { label: 'Created', color: 'slate' },
  payment_received: { label: 'Payment Received', color: 'green' },
  provisioning: { label: 'Provisioning', color: 'blue' },
  interview_pending: { label: 'Interview Needed', color: 'yellow' },
  fulfilling: { label: 'Building', color: 'blue' },
  review: { label: 'In Review', color: 'purple' },
  delivered: { label: 'Delivered', color: 'green' },
  handed_off: { label: 'Handed Off', color: 'emerald' },
  pending: { label: 'Pending', color: 'slate' },
  in_progress: { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  error: { label: 'Error', color: 'red' },
};

// Deliverable type labels
export const DELIVERABLE_LABELS: Record<DeliverableType, string> = {
  posts: 'LinkedIn Posts (10)',
  lead_magnet: 'Lead Magnet',
  funnel: 'Opt-in Funnel',
  heyreach_account: 'HeyReach Account',
  heyreach_lists: 'Prospect Lists',
};
