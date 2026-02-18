import { supabase } from '../lib/supabaseClient';
import type { ProposalPackageConfig } from '../types/proposal-types';

const GTM_API_BASE = import.meta.env.VITE_GTM_API_URL || 'https://gtmconductor.com';

async function gtmFetch(path: string, options: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${GTM_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface GenerateProposalInput {
  prospect_id?: string;
  transcript_text: string;
  selected_packages: string[];
  additional_notes?: string;
  client_name: string;
  client_company: string;
  client_title?: string;
}

export async function generateProposal(
  input: GenerateProposalInput
): Promise<{ proposal_id: string; slug: string }> {
  return gtmFetch('/api/proposals/generate', {
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
  return gtmFetch('/api/proposals/transcript', {
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
