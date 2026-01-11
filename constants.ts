import { CourseData } from './types';

export const COURSE_DATA: CourseData = {
  title: 'LinkedIn Bootcamp: Automation Mastery',
  weeks: [
    {
      id: 'week-1',
      title: 'Week 1: Fundamentals of Clay',
      actionItems: [
        { id: 'w1-a1', text: 'Join the private Slack community' },
        { id: 'w1-a2', text: 'Create your Clay account' },
        { id: 'w1-a3', text: 'Configure Webhook Source' },
        { id: 'w1-a4', text: 'Navigating the Clay Interface' },
      ],
      lessons: [
        {
          id: 'w1-l0',
          title: 'TOOL: Master Lead Database',
          embedUrl: 'https://app.clay.com/shared-table/example-master-db',
          transcript: [],
        },
        {
          id: 'w1-l1',
          title: 'Configure Webhook Source',
          embedUrl:
            'https://embed.app.guidde.com/playbooks/15mmL2a5XhaivTgBHkpgFc?mode=videoAndDoc',
          transcript: [],
        },
        {
          id: 'w1-l2',
          title: 'Navigating the Clay Interface',
          embedUrl:
            'https://embed.app.guidde.com/playbooks/15mmL2a5XhaivTgBHkpgFc?mode=videoAndDoc&lesson=w1-l2',
          transcript: [],
        },
        {
          id: 'w1-l3',
          title: 'Session Recording: Course Kickoff (YouTube)',
          embedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0',
          transcript: [],
        },
        {
          id: 'w1-l4',
          title: 'Community Guidelines & Slack Access',
          embedUrl:
            'text:<h3>Welcome to the Community!</h3>\n\nHere are the details you need to join our private Slack channel:\n\n<b>Invite Link:</b> https://slack.com/invite/linkedin-bootcamp\n<b>Access Code:</b> BOOTCAMP-2024\n\nPlease introduce yourself in the #introductions channel once you join.',
          transcript: [],
        },
      ],
    },
    {
      id: 'week-2',
      title: 'Week 2: Advanced Integrations',
      actionItems: [
        { id: 'w2-a1', text: 'Connecting OpenAI to Clay' },
        { id: 'w2-a2', text: 'Enriching Data with LinkedIn' },
        { id: 'w2-a3', text: 'Run a test enrichment on 10 leads' },
      ],
      lessons: [
        {
          id: 'w2-l1',
          title: 'Connecting OpenAI to Clay',
          embedUrl:
            'https://embed.app.guidde.com/playbooks/15mmL2a5XhaivTgBHkpgFc?mode=videoAndDoc&lesson=w2-l1',
          transcript: [],
        },
        {
          id: 'w2-l2',
          title: 'Enriching Data with LinkedIn',
          embedUrl:
            'https://embed.app.guidde.com/playbooks/15mmL2a5XhaivTgBHkpgFc?mode=videoAndDoc&lesson=w2-l2',
          transcript: [],
        },
        {
          id: 'w2-l3',
          title: 'Lead Enrichment Table Template',
          embedUrl: 'https://app.clay.com/shared-table/share_0t72rwamg5Mc7oZoRXP',
          description:
            'This table enriches lead data from webhooks with additional information such as job titles, executive classifications, and country codes. It leverages AI and external APIs to segment leads, determine their region membership, and gather recent LinkedIn posts.',
          transcript: [],
        },
      ],
    },
    {
      id: 'week-3',
      title: 'Week 3: Tools & Resources',
      actionItems: [
        { id: 'w3-a1', text: 'Watch the Sales Agent Demo' },
        { id: 'w3-a2', text: 'Deploy your own Agent instance' },
        { id: 'w3-a3', text: 'Submit your final project for review' },
      ],
      lessons: [
        {
          id: 'w3-l1',
          title: 'Agency Sales Agent Demo',
          embedUrl: 'custom-embed:deployment-37ee1fcf-e3ee-480e-ab83-b16bba97a01c',
          transcript: [],
        },
        {
          id: 'w3-l2',
          title: 'Interactive AI Agent (Example)',
          embedUrl:
            'https://studio.modernagencysales.com/form/deployment-8d5de8e9-4ca2-4b0d-90c4-5a5f9843e300',
          description:
            'Interact with this AI agent directly within the dashboard. This lesson demonstrates how to embed external Pickaxe/Agency Sales tools.',
          transcript: [],
        },
      ],
    },
  ],
};
