/** IntakeFormSection. Displays intake form responses and uploaded files with download. Co-locates IntakeFileRow. */
import { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { logError } from '../../../../lib/logError';
import { fetchIntakeFileUrls } from '../../../../services/dfy-admin-supabase';
import InfoPair from '../shared/InfoPair';

import type { DfyAdminEngagement } from '../../../../types/dfy-admin-types';

// ─── Types ─────────────────────────────────────────────
export interface IntakeFormSectionProps {
  engagement: DfyAdminEngagement;
}

interface IntakeFileRowProps {
  file: { name: string; path?: string; size: number; type: string };
  engagementId: string;
  isDarkMode: boolean;
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

// ─── Component ─────────────────────────────────────────
export default function IntakeFormSection({ engagement }: IntakeFormSectionProps) {
  const { isDarkMode } = useTheme();

  const intakeData = engagement.intake_data as {
    ideal_client?: string;
    crm_type?: string;
    crm_access?: string;
    notetaker_tool?: string;
    notetaker_other?: string;
    linkedin_url?: string;
    files?: Array<{ name: string; path: string; size: number; type: string }>;
  } | null;

  const hasFiles = (intakeData?.files?.length ?? 0) > 0;

  if (!engagement.intake_submitted_at) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          Intake Form Responses
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Not yet submitted
        </p>
      </div>
    );
  }

  const notetaker = intakeData?.notetaker_tool
    ? intakeData.notetaker_tool +
      (intakeData.notetaker_other ? ` (${intakeData.notetaker_other})` : '')
    : '\u2014';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            Ideal Client
          </p>
          <p
            className={`text-sm font-medium mt-0.5 whitespace-pre-wrap ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
          >
            {intakeData?.ideal_client || '\u2014'}
          </p>
        </div>
        <InfoPair label="CRM Type" value={intakeData?.crm_type || '\u2014'} />
        <InfoPair label="CRM Access" value={intakeData?.crm_access || '\u2014'} />
        <InfoPair label="Notetaker Tool" value={notetaker} />
        <InfoPair
          label="LinkedIn URL"
          value={
            intakeData?.linkedin_url
              ? intakeData.linkedin_url
                  .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
                  .replace(/\/$/, '')
              : '\u2014'
          }
          href={intakeData?.linkedin_url || undefined}
        />
      </div>

      {/* Files */}
      {hasFiles && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
          >
            Uploaded Files ({intakeData!.files!.length})
          </p>
          <div className="space-y-1.5">
            {intakeData!.files!.map((file, i) => (
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
