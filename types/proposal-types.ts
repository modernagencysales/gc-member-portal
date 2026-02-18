// ============================================
// Proposal Types
// ============================================

export type ProposalStatus = 'draft' | 'published' | 'archived';

export interface ProposalGoal {
  type: 'metric' | 'aspirational' | 'experimental';
  title: string;
  description: string;
  timeline: string;
}

export interface ProposalService {
  name: string;
  description: string;
  deliverables: string[];
  timeline: string;
}

export interface ProposalRoadmapPhase {
  phase: number;
  title: string;
  description: string;
  duration: string;
  milestones: string[];
}

export interface ProposalPackage {
  name: string;
  price: string;
  features: string[];
  recommended: boolean;
}

export interface ProposalCustomItem {
  label: string;
  price: string;
}

export interface ProposalPricing {
  packages: ProposalPackage[];
  customItems: ProposalCustomItem[];
  total: string;
  paymentTerms: string;
}

export interface ProposalNextStep {
  step: number;
  title: string;
  description: string;
}

export interface ProposalAboutUs {
  blurb: string;
  stats: { label: string; value: string }[];
  socialProof: string[];
}

export interface ProposalClientSnapshot {
  company: string;
  industry: string;
  size: string;
  revenue: string;
  currentState: string;
}

export interface Proposal {
  id: string;
  slug: string;
  prospectId: string | null;
  status: ProposalStatus;

  clientName: string;
  clientTitle: string | null;
  clientCompany: string;
  clientLogoUrl: string | null;
  clientBrandColor: string | null;
  clientWebsite: string | null;

  headline: string;
  executiveSummary: string;
  aboutUs: ProposalAboutUs;
  clientSnapshot: ProposalClientSnapshot;
  goals: ProposalGoal[];
  services: ProposalService[];
  roadmap: ProposalRoadmapPhase[];
  pricing: ProposalPricing;
  nextSteps: ProposalNextStep[];

  transcriptText: string | null;
  transcriptSource: string | null;
  additionalNotes: string | null;

  createdBy: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Config stored in bootcamp_settings key 'proposal_packages'
export interface ProposalPackageConfig {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  deliverables: string[];
}
