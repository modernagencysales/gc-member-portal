/**
 * BlueprintConnect Component
 * Allows bootcamp students to connect their Blueprint by entering a URL or slug.
 * Shows connection status if already linked.
 */

import React, { useState } from 'react';
import { CheckCircle, Link2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { BootcampStudent } from '../../../types/bootcamp-types';
import { Prospect, getProspectDisplayName } from '../../../types/blueprint-types';
import { getProspectBySlug, getProspectById } from '../../../services/blueprint-supabase';
import { linkStudentToProspect } from '../../../services/bootcamp-supabase';
import { logError } from '../../../lib/logError';

interface BlueprintConnectProps {
  student: BootcampStudent;
  onUpdate: () => void;
}

/**
 * Parse a Blueprint slug from various input formats:
 * - Full URL: https://example.com/blueprint/john-doe-7x3k
 * - Path: /blueprint/john-doe-7x3k
 * - Just slug: john-doe-7x3k
 */
function parseSlugFromInput(input: string): string {
  const trimmed = input.trim();

  // Try to extract from URL or path
  // Match /blueprint/SLUG pattern
  const blueprintMatch = trimmed.match(/\/blueprint\/([a-z0-9-]+)/i);
  if (blueprintMatch) {
    return blueprintMatch[1].toLowerCase();
  }

  // Check if it's a full URL without /blueprint/ prefix
  try {
    const url = new URL(trimmed);
    // Get last path segment
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1].toLowerCase();
    }
  } catch {
    // Not a valid URL, treat as slug directly
  }

  // Assume it's just a slug
  return trimmed.toLowerCase();
}

const BlueprintConnect: React.FC<BlueprintConnectProps> = ({ student, onUpdate }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedProspect, setConnectedProspect] = useState<Prospect | null>(null);

  // Fetch connected prospect info on mount if student has prospect_id
  React.useEffect(() => {
    if (student.prospectId && !connectedProspect) {
      getProspectById(student.prospectId).then((prospect) => {
        if (prospect) {
          setConnectedProspect(prospect);
        }
      });
    }
  }, [student.prospectId, connectedProspect]);

  const handleConnect = async () => {
    if (!inputValue.trim()) {
      setError('Please enter a Blueprint URL or code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const slug = parseSlugFromInput(inputValue);

      // Look up the prospect by slug
      const prospect = await getProspectBySlug(slug);

      if (!prospect) {
        setError('Blueprint not found. Please check the URL or code and try again.');
        setIsLoading(false);
        return;
      }

      // Link the student to the prospect
      await linkStudentToProspect(student.id, prospect.id);

      // Update local state
      setConnectedProspect(prospect);
      setInputValue('');

      // Notify parent to refresh
      onUpdate();
    } catch (err) {
      logError('BlueprintConnect:handleConnect', err);
      setError('Failed to connect Blueprint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleConnect();
    }
  };

  // Connected state
  if (student.prospectId) {
    const displayName = connectedProspect
      ? getProspectDisplayName(connectedProspect)
      : 'Your Blueprint';
    const blueprintUrl = connectedProspect?.slug ? `/blueprint/${connectedProspect.slug}` : null;

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-zinc-100 mb-1">Blueprint Connected</h3>
            <p className="text-sm text-zinc-400 mb-3">{displayName}</p>
            {blueprintUrl && (
              <a
                href={blueprintUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View your Blueprint
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-violet-500/10 rounded-full flex items-center justify-center shrink-0">
          <Link2 className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-100 mb-1">Connect Your Blueprint</h3>
          <p className="text-sm text-zinc-400">
            Link your LinkedIn Authority Blueprint to access personalized insights.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="blueprint-input" className="sr-only">
            Blueprint URL or code
          </label>
          <input
            id="blueprint-input"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your Blueprint URL or code"
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={isLoading || !inputValue.trim()}
          className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Blueprint'
          )}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          You can find your Blueprint URL in the email you received, or ask your coach.
        </p>
      </div>
    </div>
  );
};

export default BlueprintConnect;
