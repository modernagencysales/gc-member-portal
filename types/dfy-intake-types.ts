// DFY Intake Wizard types — used by the client portal intake form

export interface IntakeWizardData {
  bestClientUrls: Array<{ url: string; notes: string }>;
  dreamClientUrls: Array<{ url: string; notes: string }>;
  files: File[];
  rawTextDump: string;
  confirms: {
    niche: string;
    tone: string;
    keyTopics: string[];
    offer: string;
    avoid: string;
  };
}

export type IntakeStep = 'best-clients' | 'dream-clients' | 'data-dump' | 'quick-confirms';

export const INTAKE_STEPS: IntakeStep[] = [
  'best-clients',
  'dream-clients',
  'data-dump',
  'quick-confirms',
];

export const STEP_TITLES: Record<IntakeStep, string> = {
  'best-clients': 'Your Best Clients',
  'dream-clients': 'Your Dream Clients',
  'data-dump': 'The Data Dump',
  'quick-confirms': 'Quick Confirms',
};

export const SUGGESTED_DOCUMENTS = [
  'Sales call recordings',
  'Coaching call recordings',
  'Discovery call transcripts',
  'Pitch decks / sales decks',
  'Case studies (even rough ones)',
  'Offer documents / pricing pages',
  'SOPs / process docs',
  'Client testimonials / screenshots',
  "Email sequences you've used",
  'LinkedIn posts that performed well',
  'Webinar recordings',
  'Course content / frameworks',
  'Internal strategy docs',
  'Competitor research',
  'Client onboarding docs',
];
