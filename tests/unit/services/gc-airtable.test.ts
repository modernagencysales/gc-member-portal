import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyGCMember,
  fetchMemberTools,
  fetchOnboardingWithProgress,
  updateMemberProgress,
  fetchMemberICP,
  updateMemberICP,
  fetchMemberCampaigns,
  updateCampaignMetrics,
  fetchResources,
} from '../../../services/gc-airtable';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('gc-airtable service', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('verifyGCMember', () => {
    it('returns member when email matches', async () => {
      const mockRecord = {
        id: 'rec123',
        fields: {
          Email: 'test@example.com',
          Name: 'Test User',
          Company: 'Test Co',
          Plan: 'Full ($1000/mo)',
          Status: 'Active',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [mockRecord] }),
      });

      const result = await verifyGCMember('test@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
      expect(result?.name).toBe('Test User');
      expect(result?.company).toBe('Test Co');
      expect(result?.plan).toBe('Full ($1000/mo)');
    });

    it('returns null when email not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const result = await verifyGCMember('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyGCMember('test@example.com');

      expect(result).toBeNull();
    });
  });

  describe('fetchMemberTools', () => {
    it('returns array of tools for member', async () => {
      const mockRecords = [
        {
          id: 'rectool1',
          fields: {
            'Record Name': 'Clay Access',
            Member: ['rec123'],
            Tool: 'Clay',
            'Login URL': 'https://clay.com',
            Username: 'user@test.com',
            Password: 'secret123',
            'Access Type': 'Shared Account',
            Status: 'Active',
          },
        },
        {
          id: 'rectool2',
          fields: {
            'Record Name': 'Smartlead Access',
            Member: ['rec123'],
            Tool: 'Smartlead',
            'Login URL': 'https://smartlead.ai',
            'Access Type': 'Sub-Account',
            Status: 'Not Set Up',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords }),
      });

      const result = await fetchMemberTools('rec123');

      expect(result).toHaveLength(2);
      expect(result[0].tool).toBe('Clay');
      expect(result[1].tool).toBe('Smartlead');
    });

    it('returns empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchMemberTools('rec123');

      expect(result).toEqual([]);
    });
  });

  describe('fetchOnboardingWithProgress', () => {
    it('returns categories with progress', async () => {
      const checklistRecords = [
        {
          id: 'check1',
          fields: {
            Item: 'Complete ICP worksheet',
            Category: 'Week 1',
            Order: 1,
            'Support Type': 'Self-Service',
            'Plan Required': 'All Plans',
          },
        },
        {
          id: 'check2',
          fields: {
            Item: 'Set up Clay account',
            Category: 'Week 1',
            Order: 2,
            'Support Type': 'Done For You',
            'Plan Required': 'Full Only',
          },
        },
      ];

      const progressRecords = [
        {
          id: 'prog1',
          fields: {
            Member: ['rec123'],
            'Checklist Item': ['check1'],
            Status: 'Complete',
            'Completed Date': '2024-01-15',
          },
        },
      ];

      // First call: fetch checklist
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: checklistRecords }),
      });

      // Second call: fetch progress
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: progressRecords }),
      });

      const result = await fetchOnboardingWithProgress('rec123', 'Full ($1000/mo)');

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('Week 1');
      expect(result.categories[0].items).toHaveLength(2);
      expect(result.totalProgress).toBe(50); // 1 of 2 complete
    });

    it('filters items by plan', async () => {
      const checklistRecords = [
        {
          id: 'check1',
          fields: {
            Item: 'Basic task',
            Category: 'Week 1',
            Order: 1,
            'Plan Required': 'All Plans',
          },
        },
        {
          id: 'check2',
          fields: {
            Item: 'Premium task',
            Category: 'Week 1',
            Order: 2,
            'Plan Required': 'Full Only',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: checklistRecords }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      // Trial plan should only see "All Plans" items
      const result = await fetchOnboardingWithProgress('rec123', 'Trial');

      expect(result.categories[0].items).toHaveLength(1);
      expect(result.categories[0].items[0].item).toBe('Basic task');
    });
  });

  describe('updateMemberProgress', () => {
    it('creates new progress record when progressId is undefined', async () => {
      const mockCreated = {
        id: 'newprog1',
        fields: {
          Member: ['rec123'],
          'Checklist Item': ['check1'],
          Status: 'Complete',
          'Completed Date': '2024-01-15',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreated,
      });

      const result = await updateMemberProgress(undefined, 'rec123', 'check1', 'Complete');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Member%20Progress'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.status).toBe('Complete');
    });

    it('updates existing progress record', async () => {
      const mockUpdated = {
        id: 'prog1',
        fields: {
          Member: ['rec123'],
          'Checklist Item': ['check1'],
          Status: 'In Progress',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      });

      const result = await updateMemberProgress('prog1', 'rec123', 'check1', 'In Progress');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('prog1'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result.status).toBe('In Progress');
    });
  });

  describe('fetchMemberICP', () => {
    it('returns ICP data when found', async () => {
      const mockRecord = {
        id: 'icp1',
        fields: {
          'Company Name': 'Test Company',
          Member: ['rec123'],
          'Target Description': 'B2B SaaS companies',
          Verticals: 'Technology, Healthcare',
          'Company Size': '50-200 employees',
          'Job Titles': 'VP Sales, CRO',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [mockRecord] }),
      });

      const result = await fetchMemberICP('rec123');

      expect(result).not.toBeNull();
      expect(result?.companyName).toBe('Test Company');
      expect(result?.targetDescription).toBe('B2B SaaS companies');
    });

    it('returns null when no ICP found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const result = await fetchMemberICP('rec123');

      expect(result).toBeNull();
    });
  });

  describe('updateMemberICP', () => {
    it('updates existing ICP record', async () => {
      const mockUpdated = {
        id: 'icp1',
        fields: {
          'Company Name': 'Updated Company',
          Member: ['rec123'],
          'Target Description': 'Updated description',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      });

      const result = await updateMemberICP('icp1', 'rec123', {
        companyName: 'Updated Company',
        targetDescription: 'Updated description',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('icp1'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result.companyName).toBe('Updated Company');
    });

    it('creates new ICP record when icpId is undefined', async () => {
      const mockCreated = {
        id: 'newicp1',
        fields: {
          'Company Name': 'New Company',
          Member: ['rec123'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreated,
      });

      const result = await updateMemberICP(undefined, 'rec123', {
        companyName: 'New Company',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Member%20ICP'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('fetchMemberCampaigns', () => {
    it('returns campaigns for member', async () => {
      const mockRecords = [
        {
          id: 'camp1',
          fields: {
            'Campaign Name': 'Cold Email Q1',
            Member: ['rec123'],
            Channel: 'Cold Email',
            Status: 'Live',
            'Contacts Reached': 500,
            Opens: 200,
            'Replies (Self-Reported)': 25,
            'Positive Replies (Self-Reported)': 10,
            'Meetings Booked (Self-Reported)': 3,
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords }),
      });

      const result = await fetchMemberCampaigns('rec123');

      expect(result).toHaveLength(1);
      expect(result[0].campaignName).toBe('Cold Email Q1');
      expect(result[0].metrics.contactsReached).toBe(500);
      expect(result[0].metrics.meetingsBooked).toBe(3);
    });

    it('returns empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchMemberCampaigns('rec123');

      expect(result).toEqual([]);
    });
  });

  describe('updateCampaignMetrics', () => {
    it('updates campaign metrics', async () => {
      const mockUpdated = {
        id: 'camp1',
        fields: {
          'Campaign Name': 'Cold Email Q1',
          Member: ['rec123'],
          'Contacts Reached': 600,
          Opens: 250,
          'Replies (Self-Reported)': 30,
          'Last Updated By Member': '2024-01-15',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdated,
      });

      const result = await updateCampaignMetrics('camp1', {
        contactsReached: 600,
        opens: 250,
        replies: 30,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('camp1'),
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(result.metrics.contactsReached).toBe(600);
    });
  });

  describe('fetchResources', () => {
    it('returns resources filtered by plan', async () => {
      const mockRecords = [
        {
          id: 'res1',
          fields: {
            Title: 'Getting Started Guide',
            Category: 'Getting Started',
            URL: 'https://docs.example.com/start',
            Tool: 'General',
            'Plan Required': 'All Plans',
            Order: 1,
          },
        },
        {
          id: 'res2',
          fields: {
            Title: 'Advanced Clay Templates',
            Category: 'Clay',
            URL: 'https://docs.example.com/clay',
            Tool: 'Clay',
            'Plan Required': 'Full Only',
            Order: 2,
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords }),
      });

      // Full plan sees all resources
      const fullResult = await fetchResources('Full ($1000/mo)');
      expect(fullResult).toHaveLength(2);
    });

    it('filters out Full Only resources for Trial plan', async () => {
      const mockRecords = [
        {
          id: 'res1',
          fields: {
            Title: 'Basic Guide',
            'Plan Required': 'All Plans',
          },
        },
        {
          id: 'res2',
          fields: {
            Title: 'Premium Guide',
            'Plan Required': 'Full Only',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords }),
      });

      const result = await fetchResources('Trial');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Basic Guide');
    });
  });
});
