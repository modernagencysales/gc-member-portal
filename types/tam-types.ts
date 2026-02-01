// === Enums ===

export type TamProjectStatus = 'draft' | 'sourcing' | 'enriching' | 'complete';

export type TamCompanySource = 'serper' | 'storeleads' | 'apollo' | 'blitzapi' | 'smartscout';

export type TamQualificationStatus = 'pending' | 'qualified' | 'disqualified';

export type TamEmailStatus = 'found' | 'verified' | 'catch_all' | 'invalid' | 'not_found';

export type TamContactSource = 'blitzapi' | 'apollo';

export type TamJobType =
  | 'source_companies'
  | 'qualify'
  | 'find_contacts'
  | 'enrich_emails'
  | 'check_linkedin';

export type TamJobStatus = 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed';

// === ICP Profile (wizard output) ===

export type BusinessModelType =
  | 'b2b_saas'
  | 'ecommerce_dtc'
  | 'amazon_sellers'
  | 'local_service'
  | 'agencies'
  | 'other';

export interface IcpProfile {
  businessModel: BusinessModelType;
  businessModelOther?: string;
  whatYouSell: string;
  employeeSizeRanges: string[];
  geography: 'us_only' | 'specific_countries' | 'global';
  specificCountries?: string[];
  usEmployeeFilter: boolean;
  industryKeywords: string[];
  targetTitles: string[];
  seniorityPreference: string[];
  contactsPerCompany: number;
  specialCriteria?: string;
}

export interface SourcingStrategy {
  primarySource: TamCompanySource;
  secondarySources: TamCompanySource[];
  reasoning: string;
  estimatedCompanyCount?: number;
  searchConfig: Record<string, unknown>;
}

// === Domain Objects ===

export interface TamProject {
  id: string;
  userId: string;
  name: string;
  status: TamProjectStatus;
  icpProfile: IcpProfile | null;
  sourcingStrategy: SourcingStrategy | null;
  createdAt: string;
  updatedAt: string;
}

export interface TamCompany {
  id: string;
  projectId: string;
  name: string;
  domain: string | null;
  linkedinUrl: string | null;
  source: TamCompanySource | null;
  industry: string | null;
  employeeCount: number | null;
  location: string | null;
  description: string | null;
  qualificationStatus: TamQualificationStatus;
  qualificationReason: string | null;
  usEmployeePct: number | null;
  segmentTags: Record<string, string> | null;
  rawData: Record<string, unknown> | null;
  createdAt: string;
}

export interface TamContact {
  id: string;
  companyId: string;
  projectId: string;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  emailStatus: TamEmailStatus | null;
  phone: string | null;
  linkedinLastPostDate: string | null;
  linkedinActive: boolean | null;
  source: TamContactSource | null;
  rawData: Record<string, unknown> | null;
  createdAt: string;
}

export interface TamJob {
  id: string;
  projectId: string;
  jobType: TamJobType;
  status: TamJobStatus;
  config: Record<string, unknown> | null;
  progress: number;
  resultSummary: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
}

// === Aggregates ===

export interface TamCompanyWithContacts extends TamCompany {
  contacts: TamContact[];
}

export interface TamProjectStats {
  totalCompanies: number;
  qualifiedCompanies: number;
  disqualifiedCompanies: number;
  pendingCompanies: number;
  totalContacts: number;
  emailsVerified: number;
  emailsCatchAll: number;
  emailsNotFound: number;
  linkedinActive: number;
  linkedinInactive: number;
}

// === Input types ===

export interface TamProjectInput {
  name: string;
  icpProfile: IcpProfile;
}
