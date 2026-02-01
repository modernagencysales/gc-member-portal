import { describe, it, expect } from 'vitest';
import type {
  IcpProfile,
  TamCompanySource,
  TamProject,
  TamCompany,
  TamContact,
  TamJob,
  TamProjectStats,
  BusinessModelType,
  SourcingStrategy,
} from '../../../types/tam-types';

describe('TAM Types', () => {
  describe('IcpProfile', () => {
    it('accepts a complete profile with all required fields', () => {
      const profile: IcpProfile = {
        businessModel: 'b2b_saas',
        whatYouSell: 'Marketing automation software',
        employeeSizeRanges: ['11-50', '51-200'],
        geography: 'us_only',
        usEmployeeFilter: true,
        industryKeywords: ['SaaS', 'Marketing'],
        targetTitles: ['CEO', 'VP Marketing'],
        seniorityPreference: ['C-Suite', 'VP'],
        contactsPerCompany: 2,
      };

      expect(profile.businessModel).toBe('b2b_saas');
      expect(profile.employeeSizeRanges).toHaveLength(2);
    });

    it('accepts optional seedCompanyDomains field', () => {
      const profile: IcpProfile = {
        businessModel: 'b2b_saas',
        whatYouSell: 'CRM',
        employeeSizeRanges: ['1-10'],
        geography: 'global',
        usEmployeeFilter: false,
        industryKeywords: [],
        targetTitles: [],
        seniorityPreference: [],
        contactsPerCompany: 1,
        seedCompanyDomains: ['stripe.com', 'hubspot.com', 'salesforce.com'],
      };

      expect(profile.seedCompanyDomains).toHaveLength(3);
      expect(profile.seedCompanyDomains).toContain('stripe.com');
    });

    it('allows seedCompanyDomains to be undefined', () => {
      const profile: IcpProfile = {
        businessModel: 'agencies',
        whatYouSell: 'Web design',
        employeeSizeRanges: ['1-10'],
        geography: 'us_only',
        usEmployeeFilter: false,
        industryKeywords: [],
        targetTitles: [],
        seniorityPreference: [],
        contactsPerCompany: 1,
      };

      expect(profile.seedCompanyDomains).toBeUndefined();
    });

    it('accepts all business model types', () => {
      const models: BusinessModelType[] = [
        'b2b_saas',
        'ecommerce_dtc',
        'amazon_sellers',
        'local_service',
        'agencies',
        'other',
      ];

      models.forEach((model) => {
        const profile: IcpProfile = {
          businessModel: model,
          whatYouSell: 'test',
          employeeSizeRanges: [],
          geography: 'global',
          usEmployeeFilter: false,
          industryKeywords: [],
          targetTitles: [],
          seniorityPreference: [],
          contactsPerCompany: 1,
        };
        expect(profile.businessModel).toBe(model);
      });
    });

    it('accepts optional fields for other business model and specific countries', () => {
      const profile: IcpProfile = {
        businessModel: 'other',
        businessModelOther: 'Marketplace',
        whatYouSell: 'Platform',
        employeeSizeRanges: ['201-1000'],
        geography: 'specific_countries',
        specificCountries: ['US', 'CA', 'UK'],
        usEmployeeFilter: false,
        industryKeywords: ['tech'],
        targetTitles: ['CTO'],
        seniorityPreference: ['C-Suite'],
        contactsPerCompany: 1,
        specialCriteria: 'Must have series A+',
      };

      expect(profile.businessModelOther).toBe('Marketplace');
      expect(profile.specificCountries).toHaveLength(3);
      expect(profile.specialCriteria).toBe('Must have series A+');
    });
  });

  describe('TamCompanySource', () => {
    it('includes discolike as a valid source', () => {
      const sources: TamCompanySource[] = [
        'serper',
        'storeleads',
        'apollo',
        'blitzapi',
        'smartscout',
        'discolike',
      ];

      expect(sources).toHaveLength(6);
      expect(sources).toContain('discolike');
    });
  });

  describe('TamProject', () => {
    it('represents a project with all fields', () => {
      const project: TamProject = {
        id: 'proj-1',
        userId: 'user-1',
        name: 'TAM Project',
        status: 'sourcing',
        icpProfile: {
          businessModel: 'b2b_saas',
          whatYouSell: 'CRM',
          employeeSizeRanges: ['11-50'],
          geography: 'us_only',
          usEmployeeFilter: true,
          industryKeywords: ['SaaS'],
          targetTitles: ['CEO'],
          seniorityPreference: ['C-Suite'],
          contactsPerCompany: 1,
          seedCompanyDomains: ['hubspot.com'],
        },
        sourcingStrategy: null,
        createdAt: '2026-01-31T00:00:00Z',
        updatedAt: '2026-01-31T00:00:00Z',
      };

      expect(project.status).toBe('sourcing');
      expect(project.icpProfile?.seedCompanyDomains).toContain('hubspot.com');
    });
  });

  describe('TamCompany', () => {
    it('can have discolike as source', () => {
      const company: TamCompany = {
        id: 'comp-1',
        projectId: 'proj-1',
        name: 'Acme Corp',
        domain: 'acme.com',
        linkedinUrl: null,
        source: 'discolike',
        industry: 'SaaS',
        employeeCount: 50,
        location: 'California, US',
        description: 'B2B SaaS platform',
        qualificationStatus: 'pending',
        qualificationReason: null,
        usEmployeePct: null,
        segmentTags: null,
        rawData: { score: 0.95, keywords: ['saas', 'crm'] },
        createdAt: '2026-01-31T00:00:00Z',
      };

      expect(company.source).toBe('discolike');
      expect(company.rawData?.score).toBe(0.95);
    });
  });

  describe('SourcingStrategy', () => {
    it('can use discolike as primary source', () => {
      const strategy: SourcingStrategy = {
        primarySource: 'discolike',
        secondarySources: ['blitzapi'],
        reasoning: 'User provided seed domains, using lookalike discovery',
        estimatedCompanyCount: 500,
        searchConfig: { maxRecords: 500, minDigitalFootprint: 50 },
      };

      expect(strategy.primarySource).toBe('discolike');
    });
  });

  describe('TamProjectStats', () => {
    it('has all required stat fields', () => {
      const stats: TamProjectStats = {
        totalCompanies: 100,
        qualifiedCompanies: 60,
        disqualifiedCompanies: 20,
        pendingCompanies: 20,
        totalContacts: 80,
        emailsVerified: 50,
        emailsCatchAll: 10,
        emailsNotFound: 20,
        linkedinActive: 40,
        linkedinInactive: 40,
      };

      expect(stats.totalCompanies).toBe(
        stats.qualifiedCompanies + stats.disqualifiedCompanies + stats.pendingCompanies
      );
    });
  });
});
