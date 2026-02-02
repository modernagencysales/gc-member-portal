import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getYouTubeTranscript,
  summarizeLesson,
  generateICPSuggestions,
} from '../../../services/ai';

// Mock supabase client
const mockInvoke = vi.fn();
vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe('AI Service', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe('getYouTubeTranscript', () => {
    it('returns hardcoded transcript for demo video', async () => {
      const result = await getYouTubeTranscript('aqz-KE-bpKQ', 'Demo Video');

      expect(result).toContain('LinkedIn Bootcamp');
      expect(result).toContain('Clay');
    });

    it('returns placeholder for other videos', async () => {
      const result = await getYouTubeTranscript('other-video', 'Other Video');

      expect(result).toContain('Other Video');
      expect(result).toContain('video lesson');
    });
  });

  describe('summarizeLesson', () => {
    it('returns a placeholder summary', async () => {
      const result = await summarizeLesson('LinkedIn Basics', 'Full transcript here...');

      expect(typeof result).toBe('string');
      expect(result).toContain('LinkedIn Basics');
    });
  });

  describe('generateICPSuggestions', () => {
    it('returns ICP suggestions from edge function', async () => {
      const mockResponse = {
        targetDescription: 'B2B SaaS companies seeking growth',
        verticals: 'SaaS, Technology, FinTech',
        companySize: '50-500 employees',
        jobTitles: 'VP of Marketing, CMO, Head of Growth',
        geography: 'North America, Europe',
        painPoints: 'Scaling outreach, Lead quality',
        offer: 'AI-powered outreach automation',
        differentiator: 'Best-in-class personalization',
        socialProof: 'Fortune 500 case studies',
        commonObjections: 'Price, Implementation time',
      };

      mockInvoke.mockResolvedValue({ data: mockResponse, error: null });

      const result = await generateICPSuggestions('Acme Corp', 'https://acme.com');

      expect(result).toBeDefined();
      expect(result.targetDescription).toBe('B2B SaaS companies seeking growth');
      expect(mockInvoke).toHaveBeenCalledWith('generate-icp', {
        body: { companyName: 'Acme Corp', website: 'https://acme.com', existingData: undefined },
      });
    });

    it('throws error on failure', async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error('Function failed') });

      await expect(generateICPSuggestions('Acme Corp')).rejects.toThrow(
        'Unable to generate ICP suggestions'
      );
    });

    it('passes existing data to edge function', async () => {
      const existingData = {
        targetDescription: 'Already defined',
        verticals: 'Healthcare',
      };

      mockInvoke.mockResolvedValue({
        data: { ...existingData, companySize: '100-1000' },
        error: null,
      });

      const result = await generateICPSuggestions('Health Tech Inc', undefined, existingData);

      expect(result).toBeDefined();
      expect(mockInvoke).toHaveBeenCalledWith('generate-icp', {
        body: { companyName: 'Health Tech Inc', website: undefined, existingData },
      });
    });
  });
});
