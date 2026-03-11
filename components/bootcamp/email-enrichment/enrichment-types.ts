/**
 * enrichment-types.ts
 * Shared types and constants for the Email Enrichment wizard.
 * Constraint: no imports, no side effects — pure type/constant definitions.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnrichmentField =
  | 'first_name'
  | 'last_name'
  | 'company_name'
  | 'company_domain'
  | 'linkedin_url';

export type EnrichmentStep = 'upload' | 'map' | 'processing' | 'results';

// ─── Constants ────────────────────────────────────────────────────────────────

export const FIELD_CONFIG: Record<
  EnrichmentField,
  { label: string; required: boolean; hints: string[] }
> = {
  first_name: {
    label: 'First Name',
    required: true,
    hints: ['first_name', 'firstname', 'first name', 'given name'],
  },
  last_name: {
    label: 'Last Name',
    required: true,
    hints: ['last_name', 'lastname', 'last name', 'surname', 'family name'],
  },
  company_name: {
    label: 'Company Name',
    required: false,
    hints: ['company', 'company_name', 'company name', 'organization'],
  },
  company_domain: {
    label: 'Company Domain',
    required: false,
    hints: ['domain', 'company_domain', 'website', 'company_website', 'url'],
  },
  linkedin_url: {
    label: 'LinkedIn URL',
    required: false,
    hints: ['linkedin', 'linkedin_url', 'linkedin url', 'profile_url', 'linkedin_profile'],
  },
};

export const ALL_FIELDS: EnrichmentField[] = [
  'first_name',
  'last_name',
  'company_name',
  'company_domain',
  'linkedin_url',
];

export const EMPTY_COLUMN_MAP: Record<EnrichmentField, string> = {
  first_name: '',
  last_name: '',
  company_name: '',
  company_domain: '',
  linkedin_url: '',
};
