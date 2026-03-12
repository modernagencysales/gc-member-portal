/** IntakeFormSection. Displays intake form responses and uploaded files with download. Handles both legacy form and wizard (intro offer) data shapes. */
import { useState } from 'react';
import { FileText, Download, Loader2, ExternalLink, SkipForward } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { logError } from '../../../../lib/logError';
import { fetchIntakeFileUrls } from '../../../../services/dfy-admin-supabase';
import InfoPair from '../shared/InfoPair';

import type { DfyAdminEngagement } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface IntakeFormSectionProps {
  engagement: DfyAdminEngagement;
  onSkipIntake?: () => void;
  isSkippingIntake?: boolean;
}

interface IntakeFileRowProps {
  file: { name: string; path?: string; size: number; type: string };
  engagementId: string;
  isDarkMode: boolean;
}

interface LegacyIntakeData {
  ideal_client?: string;
  crm_type?: string;
  crm_access?: string;
  notetaker_tool?: string;
  notetaker_other?: string;
  linkedin_url?: string;
  files?: Array<{ name: string; path: string; size: number; type: string }>;
}

interface WizardIntakeData {
  best_client_urls?: Array<{ url?: string; notes?: string }>;
  dream_client_urls?: Array<{ url?: string; notes?: string }>;
  inspiration_urls?: Array<{ url?: string; notes?: string }>;
  raw_text_dump?: string;
  confirms?: Record<string, string | string[]>;
  file_records?: Array<{ name: string; path: string; size: number; type: string }>;
}

function isWizardData(data: Record<string, unknown>): boolean {
  return 'best_client_urls' in data || 'dream_client_urls' in data || 'raw_text_dump' in data;
}

// ─── IntakeFileRow (co-located) ─────────────────────────
function IntakeFileRow({ file, engagementId, isDarkMode }: IntakeFileRowProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleDownload = async () => {
    if (url) {
      window.open(url, '_blank');
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const result = await fetchIntakeFileUrls(engagementId);
      const match = result.find((f) => f.name === file.name);
      if (match?.url) {
        setUrl(match.url);
        window.open(match.url, '_blank');
      } else {
        setError(true);
      }
    } catch (err) {
      logError('IntakeFormSection:intakeFileDownload', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
        isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileText
          className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
        />
        <span className={`truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>
          {file.name}
        </span>
        <span className={`text-xs flex-shrink-0 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {(file.size / 1024).toFixed(0)} KB
        </span>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 px-2 py-1 rounded transition-colors ${
          error
            ? 'text-red-400'
            : isDarkMode
              ? 'text-violet-400 hover:bg-zinc-700'
              : 'text-violet-600 hover:bg-zinc-100'
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {error ? 'Failed' : loading ? '' : 'Download'}
      </button>
    </div>
  );
}

// ─── URL List (co-located) ─────────────────────────────
function UrlList({
  urls,
  isDarkMode,
}: {
  urls: Array<{ url?: string; notes?: string }>;
  isDarkMode: boolean;
}) {
  const validUrls = urls.filter((u) => u?.url?.trim());
  if (!validUrls.length) return <span>{'\u2014'}</span>;

  const formatUrlDisplay = (url: string) => {
    try {
      const parsed = new URL(url);
      // For LinkedIn, show just the path slug
      if (parsed.hostname.includes('linkedin.com')) {
        return parsed.pathname
          .replace(/^\/in\//, '')
          .replace(/^\/company\//, '')
          .replace(/\/$/, '');
      }
      // For other URLs, show domain + path
      return (
        parsed.hostname.replace(/^www\./, '') +
        (parsed.pathname !== '/' ? parsed.pathname.replace(/\/$/, '') : '')
      );
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    }
  };

  return (
    <div className="space-y-1.5">
      {validUrls.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm font-medium flex items-center gap-1 ${
              isDarkMode
                ? 'text-violet-400 hover:text-violet-300'
                : 'text-violet-600 hover:text-violet-700'
            }`}
          >
            {formatUrlDisplay(item.url!)}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
          {item.notes && (
            <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              — {item.notes}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Processed Intake (AI-synthesized) ─────────────────
function ProcessedIntakeSection({
  processed,
  isDarkMode,
}: {
  processed: Record<string, unknown>;
  isDarkMode: boolean;
}) {
  const labelClass = `text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`;
  const textClass = `text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`;

  const icp = processed.icp as
    | { industry?: string; company_size?: string; job_titles?: string[]; pain_points?: string[] }
    | undefined;
  const content = processed.content as { key_topics?: string[]; tone_notes?: string } | undefined;
  const outreach = processed.outreach as
    | { target_companies?: string[]; geographic_focus?: string }
    | undefined;

  return (
    <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
      <p className={`${labelClass} mb-3`}>AI-Processed Intake Summary</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {icp && (
          <>
            <InfoPair label="Industry" value={icp.industry || '\u2014'} />
            <InfoPair label="Company Size" value={icp.company_size || '\u2014'} />
            {icp.job_titles?.length ? (
              <InfoPair label="Target Titles" value={icp.job_titles.join(', ')} />
            ) : null}
            {icp.pain_points?.length ? (
              <div className="md:col-span-2">
                <p className={labelClass}>Pain Points</p>
                <ul className={`mt-1 list-disc list-inside ${textClass}`}>
                  {icp.pain_points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
        {content?.key_topics?.length ? (
          <InfoPair label="Key Topics" value={content.key_topics.join(', ')} />
        ) : null}
        {content?.tone_notes ? <InfoPair label="Tone" value={content.tone_notes} /> : null}
        {outreach?.geographic_focus ? (
          <InfoPair label="Geographic Focus" value={outreach.geographic_focus} />
        ) : null}
        {outreach?.target_companies?.length ? (
          <InfoPair label="Target Companies" value={outreach.target_companies.join(', ')} />
        ) : null}
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────
export default function IntakeFormSection({
  engagement,
  onSkipIntake,
  isSkippingIntake,
}: IntakeFormSectionProps) {
  const { isDarkMode } = useTheme();

  const intakeData = engagement.intake_data;
  const isWizard = intakeData ? isWizardData(intakeData) : false;

  const legacyData = intakeData as LegacyIntakeData | null;
  const wizardData = intakeData as WizardIntakeData | null;
  const files = isWizard ? wizardData?.file_records : legacyData?.files;
  const hasFiles = (files?.length ?? 0) > 0;

  const canSkipIntake =
    !engagement.intake_submitted_at &&
    !!engagement.call_transcript &&
    engagement.intake_status === 'pending';

  if (!engagement.intake_submitted_at) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              Intake Form Responses
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {engagement.intake_status === 'processing'
                ? 'Processing intake from transcript...'
                : 'Not yet submitted'}
            </p>
          </div>
          {canSkipIntake && onSkipIntake && (
            <button
              onClick={onSkipIntake}
              disabled={isSkippingIntake}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border border-amber-800/50'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              } disabled:opacity-50`}
            >
              {isSkippingIntake ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SkipForward className="w-3.5 h-3.5" />
              )}
              {isSkippingIntake ? 'Processing...' : 'Skip Intake — Use Transcript'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const labelClass = `text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`;
  const textClass = `text-sm font-medium mt-0.5 whitespace-pre-wrap ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`;

  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Intake Form Responses
        </h3>
        <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Submitted {new Date(engagement.intake_submitted_at!).toLocaleString()}
        </span>
      </div>

      {isWizard ? (
        /* ─── Wizard (Intro Offer) intake ─── */
        <div className="space-y-4">
          <div>
            <p className={labelClass}>Best Client Company URLs</p>
            <div className="mt-1">
              <UrlList urls={wizardData?.best_client_urls || []} isDarkMode={isDarkMode} />
            </div>
          </div>

          <div>
            <p className={labelClass}>Dream Client Company URLs</p>
            <div className="mt-1">
              <UrlList urls={wizardData?.dream_client_urls || []} isDarkMode={isDarkMode} />
            </div>
          </div>

          <div>
            <p className={labelClass}>Content Inspiration (LinkedIn)</p>
            <div className="mt-1">
              <UrlList urls={wizardData?.inspiration_urls || []} isDarkMode={isDarkMode} />
            </div>
          </div>

          {wizardData?.raw_text_dump && (
            <div>
              <p className={labelClass}>Additional Context</p>
              <p className={textClass}>{wizardData.raw_text_dump}</p>
            </div>
          )}

          {wizardData?.confirms && Object.keys(wizardData.confirms).length > 0 && (
            <div>
              <p className={labelClass}>Quick Confirms</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {Object.entries(wizardData.confirms).map(([key, value]) => (
                  <div key={key}>
                    <p
                      className={`text-xs capitalize ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
                    >
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p
                      className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
                    >
                      {Array.isArray(value) ? value.join(', ') : String(value) || '\u2014'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── Legacy intake form ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <p className={labelClass}>Ideal Client</p>
            <p className={textClass}>{legacyData?.ideal_client || '\u2014'}</p>
          </div>
          <InfoPair label="CRM Type" value={legacyData?.crm_type || '\u2014'} />
          <InfoPair label="CRM Access" value={legacyData?.crm_access || '\u2014'} />
          <InfoPair
            label="Notetaker Tool"
            value={
              legacyData?.notetaker_tool
                ? legacyData.notetaker_tool +
                  (legacyData.notetaker_other ? ` (${legacyData.notetaker_other})` : '')
                : '\u2014'
            }
          />
          <InfoPair
            label="LinkedIn URL"
            value={
              legacyData?.linkedin_url
                ? legacyData.linkedin_url
                    .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
                    .replace(/\/$/, '')
                : '\u2014'
            }
            href={legacyData?.linkedin_url || undefined}
          />
        </div>
      )}

      {/* AI-Processed Intake (shown when available, typically for wizard submissions) */}
      {engagement.processed_intake && Object.keys(engagement.processed_intake).length > 0 && (
        <ProcessedIntakeSection processed={engagement.processed_intake} isDarkMode={isDarkMode} />
      )}

      {/* Files */}
      {hasFiles && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            Uploaded Files ({files!.length})
          </p>
          <div className="space-y-1.5">
            {files!.map((file, i) => (
              <IntakeFileRow
                key={i}
                file={file}
                engagementId={engagement.id}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
