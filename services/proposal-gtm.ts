import { supabase } from '../lib/supabaseClient';
import { gtmAdminFetch } from '../lib/api/gtm-fetch';
import type { ProposalPackageConfig } from '../types/proposal-types';

export interface GenerateProposalInput {
  prospect_id?: string;
  transcript_text: string;
  selected_packages: string[];
  additional_notes?: string;
  client_name: string;
  client_company: string;
  client_title?: string;
  client_website?: string;
}

export async function generateProposal(
  input: GenerateProposalInput
): Promise<{ proposal_id: string; slug: string }> {
  return gtmAdminFetch('/api/proposals/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export interface AttioNote {
  title: string;
  content: string;
  created_at: string;
}

export async function fetchAttioTranscript(
  email?: string,
  linkedinUrl?: string
): Promise<{ notes: AttioNote[] }> {
  return gtmAdminFetch('/api/proposals/transcript', {
    method: 'POST',
    body: JSON.stringify({ email, linkedin_url: linkedinUrl }),
  });
}

export async function fetchProposalPackages(): Promise<ProposalPackageConfig[]> {
  const { data, error } = await supabase
    .from('bootcamp_settings')
    .select('value')
    .eq('key', 'proposal_packages')
    .single();

  if (error || !data) return [];
  return data.value?.packages || [];
}

// Proposal AI Prompts — editable via admin panel
export interface ProposalPrompts {
  system_prompt: string;
  user_message_template: string;
  eval_prompt: string;
}

export async function fetchProposalPrompts(): Promise<ProposalPrompts | null> {
  const { data, error } = await supabase
    .from('bootcamp_settings')
    .select('value')
    .eq('key', 'proposal_prompts')
    .single();

  if (error || !data) return null;
  return data.value as ProposalPrompts;
}

export async function saveProposalPrompts(prompts: ProposalPrompts): Promise<void> {
  const { error } = await supabase
    .from('bootcamp_settings')
    .update({ value: prompts })
    .eq('key', 'proposal_prompts');

  if (error) throw new Error(error.message);
}
