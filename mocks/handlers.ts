import { http, HttpResponse } from 'msw';

const BASE_ID = 'appxQJMeJCq5tqgjW';

// Mock data
export const mockGCMember = {
  id: 'recMockMember123',
  fields: {
    Email: 'test@example.com',
    Name: 'Test User',
    Plan: 'Full ($1000/mo)',
    Status: 'Active',
  },
};

export const mockOnboardingItems = [
  {
    id: 'recOnboard1',
    fields: {
      Item: 'Complete ICP worksheet',
      Category: 'Week 1',
      'Support Type': 'Self-Service',
      Order: 1,
      'Plan Required': 'All Plans',
    },
  },
  {
    id: 'recOnboard2',
    fields: {
      Item: 'Set up Clay account',
      Category: 'Week 1',
      'Support Type': 'Initial Setup Help',
      Order: 2,
      'Plan Required': 'Full Only',
    },
  },
];

export const mockCampaigns = [
  {
    id: 'recCampaign1',
    fields: {
      Name: 'Q1 Outreach',
      Status: 'Active',
      'Sent Count': 500,
      'Reply Count': 45,
      'Positive Reply Count': 20,
      'Meetings Booked': 8,
    },
  },
];

export const handlers = [
  // GC Member verification
  http.get(`https://api.airtable.com/v0/${BASE_ID}/GC%20Members`, ({ request }) => {
    const url = new URL(request.url);
    const filterFormula = url.searchParams.get('filterByFormula');

    // Check if looking for a specific email
    if (filterFormula?.includes('test@example.com')) {
      return HttpResponse.json({ records: [mockGCMember] });
    }

    // Return empty for unknown emails
    return HttpResponse.json({ records: [] });
  }),

  // Onboarding checklist
  http.get(`https://api.airtable.com/v0/${BASE_ID}/Onboarding%20Checklist`, () => {
    return HttpResponse.json({ records: mockOnboardingItems });
  }),

  // Member progress
  http.get(`https://api.airtable.com/v0/${BASE_ID}/Member%20Progress`, () => {
    return HttpResponse.json({ records: [] });
  }),

  // Update progress
  http.post(`https://api.airtable.com/v0/${BASE_ID}/Member%20Progress`, async ({ request }) => {
    const body = (await request.json()) as { fields: Record<string, unknown> };
    return HttpResponse.json({
      id: 'recNewProgress',
      fields: body.fields,
    });
  }),

  http.patch(
    `https://api.airtable.com/v0/${BASE_ID}/Member%20Progress/:id`,
    async ({ request, params }) => {
      const body = (await request.json()) as { fields: Record<string, unknown> };
      return HttpResponse.json({
        id: params.id,
        fields: body.fields,
      });
    }
  ),

  // Campaigns
  http.get(`https://api.airtable.com/v0/${BASE_ID}/Campaigns`, () => {
    return HttpResponse.json({ records: mockCampaigns });
  }),

  // Tool access
  http.get(`https://api.airtable.com/v0/${BASE_ID}/Tool%20Access`, () => {
    return HttpResponse.json({ records: [] });
  }),

  // Member ICP
  http.get(`https://api.airtable.com/v0/${BASE_ID}/Member%20ICP`, () => {
    return HttpResponse.json({ records: [] });
  }),

  // Resources
  http.get(`https://api.airtable.com/v0/${BASE_ID}/Resources`, () => {
    return HttpResponse.json({ records: [] });
  }),

  // Bootcamp tables
  http.get(`https://api.airtable.com/v0/${BASE_ID}/Users`, () => {
    return HttpResponse.json({ records: [] });
  }),

  http.get(`https://api.airtable.com/v0/${BASE_ID}/Modules`, () => {
    return HttpResponse.json({ records: [] });
  }),

  http.get(`https://api.airtable.com/v0/${BASE_ID}/Lessons`, () => {
    return HttpResponse.json({ records: [] });
  }),

  http.get(`https://api.airtable.com/v0/${BASE_ID}/Progress`, () => {
    return HttpResponse.json({ records: [] });
  }),
];
