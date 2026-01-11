import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyUser, fetchCourseData } from '../../../services/airtable';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('airtable service (bootcamp)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('verifyUser', () => {
    it('returns user when email matches exactly', async () => {
      const mockRecord = {
        id: 'rec123',
        fields: {
          Email: 'student@example.com',
          Name: 'Test Student',
          Cohort: 'Cohort 1',
          Status: 'Full Access',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [mockRecord] }),
      });

      const result = await verifyUser('student@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('student@example.com');
      expect(result?.name).toBe('Test Student');
      expect(result?.cohort).toBe('Cohort 1');
      expect(result?.status).toBe('Full Access');
    });

    it('returns user when domain matches', async () => {
      const mockRecord = {
        id: 'rec456',
        fields: {
          Email: '@company.com',
          Name: 'Company User',
          Cohort: 'Global',
          Status: 'Full Access',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [mockRecord] }),
      });

      const result = await verifyUser('anyone@company.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('anyone@company.com');
    });

    it('returns null when email not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const result = await verifyUser('unknown@example.com');

      expect(result).toBeNull();
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyUser('test@example.com');

      expect(result).toBeNull();
    });

    it('normalizes email to lowercase', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      await verifyUser('TEST@EXAMPLE.COM');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test%40example.com'),
        expect.any(Object)
      );
    });
  });

  describe('fetchCourseData', () => {
    it('returns course data with lessons and action items', async () => {
      const lessonsRecords = [
        {
          id: 'lesson1',
          fields: {
            Title: 'Introduction',
            'Embed URL': 'https://www.youtube.com/watch?v=abc123',
            Week: 'Week 1',
            Description: 'Getting started',
          },
        },
        {
          id: 'lesson2',
          fields: {
            Title: 'Advanced Topics',
            'Embed URL': 'https://loom.com/share/xyz789',
            Week: 'Week 2',
          },
        },
      ];

      const actionItemsRecords = [
        {
          id: 'action1',
          fields: {
            Text: 'Complete the worksheet',
            Week: 'Week 1',
          },
        },
      ];

      // First call: lessons
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: lessonsRecords }),
      });

      // Second call: action items
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: actionItemsRecords }),
      });

      const result = await fetchCourseData('Global', 'test@example.com');

      expect(result.weeks).toHaveLength(2);
      expect(result.weeks[0].lessons).toHaveLength(1);
      expect(result.weeks[0].actionItems).toHaveLength(1);
    });

    it('normalizes YouTube URLs to embed format', async () => {
      const lessonsRecords = [
        {
          id: 'lesson1',
          fields: {
            Title: 'Video Lesson',
            'Embed URL': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            Week: 'Week 1',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: lessonsRecords }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const result = await fetchCourseData('Global', 'test@example.com');

      expect(result.weeks[0].lessons[0].embedUrl).toBe(
        'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'
      );
    });

    it('normalizes Loom URLs to embed format', async () => {
      const lessonsRecords = [
        {
          id: 'lesson1',
          fields: {
            Title: 'Loom Video',
            'Embed URL': 'https://www.loom.com/share/abc12345-def6-7890-ghij-klmnopqrstuv',
            Week: 'Week 1',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: lessonsRecords }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const result = await fetchCourseData('Global', 'test@example.com');

      expect(result.weeks[0].lessons[0].embedUrl).toContain('/embed/');
    });

    it('filters lessons by cohort', async () => {
      const lessonsRecords = [
        {
          id: 'lesson1',
          fields: {
            Title: 'Global Lesson',
            'Embed URL': 'https://example.com/1',
            Week: 'Week 1',
            Cohort: 'Global',
          },
        },
        {
          id: 'lesson2',
          fields: {
            Title: 'Cohort 1 Only',
            'Embed URL': 'https://example.com/2',
            Week: 'Week 1',
            Cohort: 'Cohort 1',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: lessonsRecords }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const result = await fetchCourseData('Cohort 2', 'test@example.com');

      // Should only see Global lesson, not Cohort 1 specific
      expect(result.weeks[0].lessons).toHaveLength(1);
      expect(result.weeks[0].lessons[0].title).toBe('Global Lesson');
    });

    it('includes lessons assigned to specific user', async () => {
      const lessonsRecords = [
        {
          id: 'lesson1',
          fields: {
            Title: 'Personal Lesson',
            'Embed URL': 'https://example.com/1',
            Week: 'Week 1',
            'Assigned To': 'specific@example.com',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: lessonsRecords }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }),
      });

      const result = await fetchCourseData('Global', 'specific@example.com');

      expect(result.weeks[0].lessons).toHaveLength(1);
    });

    it('excludes action items assigned to different user', async () => {
      // Note: Lessons don't use Assigned To filtering, only action items do
      const actionItemsRecords = [
        {
          id: 'action1',
          fields: {
            Text: 'Personal Task',
            Week: 'Week 1',
            'Assigned To': 'other@example.com',
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] }), // No lessons
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: actionItemsRecords }),
      });

      const result = await fetchCourseData('Global', 'me@example.com');

      // When action item is assigned to different user, it should be filtered out
      const allActionItems = result.weeks.flatMap((w) => w.actionItems);
      expect(allActionItems).toHaveLength(0);
    });
  });
});
