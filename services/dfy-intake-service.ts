import { supabase } from '../lib/supabaseClient';
import type { IntakeWizardData } from '../types/dfy-intake-types';
import { getPortalToken } from './dfy-service';

const GTM_SYSTEM_URL = import.meta.env.VITE_GTM_SYSTEM_URL || 'https://www.modernagencysales.com';

export async function submitIntakeWizard(
  portalSlug: string,
  data: IntakeWizardData
): Promise<void> {
  const token = getPortalToken();
  if (!token) throw new Error('Not authenticated');

  // 1. Upload files to Supabase Storage
  const fileRecords: Array<{ name: string; path: string; size: number; type: string }> = [];

  for (const file of data.files) {
    const fileId = globalThis.crypto.randomUUID();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${portalSlug}/${fileId}-${sanitizedName}`;

    const { error } = await supabase.storage
      .from('dfy-intake-files')
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (error) throw new Error(`Failed to upload "${file.name}": ${error.message}`);

    fileRecords.push({
      name: file.name,
      path: storagePath,
      size: file.size,
      type: file.type,
    });
  }

  // 2. Build wizard_data payload
  const wizardPayload = {
    best_client_urls: data.bestClientUrls.filter((u) => u.url.trim()),
    dream_client_urls: data.dreamClientUrls.filter((u) => u.url.trim()),
    raw_text_dump: data.rawTextDump,
    confirms: {
      niche: data.confirms.niche,
      tone: data.confirms.tone,
      key_topics: data.confirms.keyTopics,
      offer: data.confirms.offer,
      avoid: data.confirms.avoid,
    },
    file_records: fileRecords,
  };

  // 3. Submit to gtm-system as FormData with wizard_data JSON
  const formData = new FormData();
  formData.append('wizard_data', JSON.stringify(wizardPayload));

  const res = await fetch(`${GTM_SYSTEM_URL}/api/dfy/client/intake`, {
    method: 'POST',
    headers: {
      'x-client-portal-token': token,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Submission failed' }));
    throw new Error(err.error || `Submission failed (${res.status})`);
  }
}

export async function fetchBlueprintData(prospectId: string): Promise<{
  niche: string;
  tone: string;
  keyTopics: string[];
  offer: string;
} | null> {
  if (!prospectId) return null;

  const { data: prospect } = await supabase
    .from('prospects')
    .select('analysis_results')
    .eq('id', prospectId)
    .single();

  if (!prospect?.analysis_results) return null;

  const analysis = prospect.analysis_results as Record<string, unknown>;

  // Extract relevant fields from Blueprint analysis
  // The analysis_results structure varies, so extract what we can
  return {
    niche: (analysis.niche as string) || (analysis.industry as string) || '',
    tone: (analysis.tone as string) || (analysis.voice_style as string) || '',
    keyTopics: (analysis.key_topics as string[]) || (analysis.topics as string[]) || [],
    offer: (analysis.offer as string) || (analysis.primary_offer as string) || '',
  };
}
