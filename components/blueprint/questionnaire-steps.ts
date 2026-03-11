/**
 * questionnaire-steps.ts
 * Step configuration and shared types for BlueprintQuestionnaire.
 * Separated from the component to keep each file under 300 lines.
 */

import type { FormData } from '../../hooks/useBlueprintForm';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StepOption {
  label: string;
  value: string;
}

export interface StepConfig {
  id: string;
  question: string;
  subtitle?: string;
  type: 'text' | 'textarea' | 'single-select' | 'binary';
  field: keyof FormData;
  options?: StepOption[];
  placeholder?: string;
  required?: boolean; // defaults to true
  validation?: (value: string) => string | null;
}

// ─── Step config ──────────────────────────────────────────────────────────────

export const QUESTIONNAIRE_STEPS: StepConfig[] = [
  {
    id: 'linkedin-url',
    question: "What's your LinkedIn profile URL?",
    subtitle:
      'This is the only thing we need to generate your blueprint. Everything else helps us make it better.',
    type: 'text',
    field: 'linkedinUrl',
    placeholder: 'https://linkedin.com/in/your-profile',
    validation: (v) =>
      /linkedin\.com\/in\//i.test(v)
        ? null
        : 'Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/your-name)',
  },
  {
    id: 'phone',
    question: "What's the best number to reach you?",
    subtitle:
      'Optional — so we can follow up with a quick call if your blueprint reveals big opportunities.',
    type: 'text',
    field: 'phone',
    placeholder: '+1 (555) 123-4567',
    required: false,
  },
  {
    id: 'business-type',
    question: 'What type of business do you run?',
    type: 'single-select',
    field: 'businessType',
    options: [
      { label: 'Agency', value: 'Agency' },
      { label: 'Consulting', value: 'Consulting' },
      { label: 'Coaching', value: 'Coaching' },
      { label: 'SaaS', value: 'SaaS' },
      { label: 'Freelance', value: 'Freelance' },
      { label: 'Other', value: 'Other' },
    ],
  },
  {
    id: 'linkedin-challenge',
    question: "What's your biggest LinkedIn challenge right now?",
    subtitle: 'Be specific — this helps us tailor your blueprint.',
    type: 'textarea',
    field: 'linkedinChallenge',
    placeholder: 'e.g. I post regularly but get no inbound leads...',
  },
  {
    id: 'posting-frequency',
    question: 'How often do you post on LinkedIn?',
    subtitle: 'Roughly how often are you posting?',
    type: 'single-select',
    field: 'postingFrequency',
    options: [
      { label: 'Daily', value: 'Daily' },
      { label: 'Weekly', value: 'Weekly' },
      { label: 'Monthly', value: 'Monthly' },
      { label: 'Less than monthly', value: 'Less than monthly' },
    ],
  },
  {
    id: 'help-area',
    question: 'What do you need the most help with?',
    type: 'single-select',
    field: 'linkedinHelpArea',
    options: [
      { label: 'Profile optimization', value: 'Profile optimization' },
      { label: 'Content strategy', value: 'Content strategy' },
      { label: 'Lead generation', value: 'Lead generation' },
      { label: 'Building authority', value: 'Building authority' },
      { label: 'All of the above', value: 'All of the above' },
    ],
  },
  {
    id: 'has-funnel',
    question: 'Do you have a content-to-funnel system?',
    subtitle: 'A system that turns LinkedIn content into booked calls or sales.',
    type: 'binary',
    field: 'hasFunnel',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
  },
  {
    id: 'learning-investment',
    question: 'How much have you invested in your own learning in the last year?',
    type: 'single-select',
    field: 'learningInvestment',
    options: [
      { label: 'Just free resources', value: 'Free resources only' },
      { label: 'Under $500', value: 'Under $500' },
      { label: '$500 - $2,000', value: '$500-$2000' },
      { label: '$2,000+', value: '$2000+' },
    ],
  },
  {
    id: 'monthly-revenue',
    question: "What's your current monthly revenue?",
    subtitle: 'This helps us calibrate recommendations to your stage.',
    type: 'single-select',
    field: 'monthlyIncome',
    options: [
      { label: 'Not generating revenue yet', value: 'Not generating revenue yet' },
      { label: 'Under $5k', value: 'Under $5k' },
      { label: '$5k - $10k', value: '$5k-$10k' },
      { label: '$10k - $30k', value: '$10k-$30k' },
      { label: '$30k - $50k', value: '$30k-$50k' },
      { label: '$50k - $100k', value: '$50k-$100k' },
      { label: '$100k+', value: '$100k+' },
    ],
  },
];

export const LETTER_PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F'];
