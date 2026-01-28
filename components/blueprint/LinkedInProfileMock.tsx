import React, { useState } from 'react';
import { MapPin, Users, Copy, Check } from 'lucide-react';
import { Prospect } from '../../types/blueprint-types';

// ============================================
// Types
// ============================================

interface LinkedInProfileMockProps {
  prospect: Prospect;
}

type HeadlineOption = 'outcome' | 'authority' | 'hybrid';

interface HeadlineTabConfig {
  key: HeadlineOption;
  label: string;
  getValue: (prospect: Prospect) => string | undefined;
}

// ============================================
// Constants
// ============================================

const HEADLINE_OPTIONS: HeadlineTabConfig[] = [
  { key: 'outcome', label: 'Outcome', getValue: (p) => p.headlineOutcomeBased },
  { key: 'authority', label: 'Authority', getValue: (p) => p.headlineAuthorityBased },
  { key: 'hybrid', label: 'Hybrid', getValue: (p) => p.headlineHybrid },
];

// ============================================
// Copy Inline Button
// ============================================

const CopyInlineButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-700 rounded transition-colors"
      aria-label={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

// ============================================
// LinkedInProfileMock Component
// ============================================

const LinkedInProfileMock: React.FC<LinkedInProfileMockProps> = ({ prospect }) => {
  const [activeHeadline, setActiveHeadline] = useState<HeadlineOption>('outcome');

  // Get display values
  const displayName =
    prospect.fullName ||
    [prospect.firstName, prospect.lastName].filter(Boolean).join(' ') ||
    'Your Name';

  const activeConfig = HEADLINE_OPTIONS.find((h) => h.key === activeHeadline);
  const headline =
    activeConfig?.getValue(prospect) ||
    prospect.recommendedHeadline ||
    prospect.currentHeadline ||
    '';

  const bio = prospect.recommendedBio || prospect.currentBio || '';
  const location = prospect.location || '';
  const connections = prospect.connections;
  const jobTitle = prospect.jobTitle || '';
  const company = prospect.company || '';

  // Don't render if we don't have any meaningful profile data
  const hasHeadlines =
    prospect.headlineOutcomeBased ||
    prospect.headlineAuthorityBased ||
    prospect.headlineHybrid ||
    prospect.recommendedHeadline;
  if (!hasHeadlines && !bio) return null;

  // Determine which headline tabs have content
  const availableTabs = HEADLINE_OPTIONS.filter((t) => t.getValue(prospect));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">YOUR NEW LINKEDIN PROFILE</h2>
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Preview</span>
      </div>

      {/* LinkedIn Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Banner */}
        <div className="relative h-36 sm:h-44">
          {prospect.bannerImage ? (
            <img
              src={prospect.bannerImage}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-600 via-blue-600 to-violet-500">
              {/* NEW HEADLINE overlay — only on gradient fallback */}
              {headline && (
                <div className="absolute inset-0 flex items-center justify-center px-8">
                  <div className="text-center">
                    <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-200 bg-black/30 rounded-full backdrop-blur-sm">
                      New Headline
                    </span>
                    <p className="text-white text-sm sm:text-base md:text-lg font-semibold leading-snug drop-shadow-lg max-w-xl">
                      {headline}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="relative px-6 pb-6">
          {/* Profile Photo */}
          <div className="-mt-14 mb-3 flex items-end justify-between">
            <div className="w-28 h-28 rounded-full border-4 border-zinc-900 overflow-hidden bg-zinc-800 shrink-0">
              {prospect.profilePhoto ? (
                <img
                  src={prospect.profilePhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-500">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>

            {/* LinkedIn-style action buttons */}
            <div className="flex items-center gap-2 pb-1">
              <div className="px-5 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-full cursor-default">
                Connect
              </div>
              <div className="px-5 py-1.5 text-sm font-semibold text-blue-400 border border-blue-400 rounded-full cursor-default">
                Message
              </div>
            </div>
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-zinc-100">{displayName}</h3>

          {/* Headline (below name, like real LinkedIn) */}
          {headline && (
            <p className="text-sm text-zinc-300 mt-1 leading-relaxed max-w-lg">{headline}</p>
          )}

          {/* Location & connections row */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-500">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            {connections !== undefined && connections > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {connections >= 500 ? '500+' : connections} connections
              </span>
            )}
            {jobTitle && company && (
              <span>
                {jobTitle} at {company}
              </span>
            )}
            {jobTitle && !company && <span>{jobTitle}</span>}
          </div>

          {/* Headline Switcher */}
          {availableTabs.length > 1 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Headline style
                </span>
                {headline && <CopyInlineButton text={headline} />}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveHeadline(tab.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeHeadline === tab.key
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* About Section */}
          {bio && (
            <div className="mt-5 pt-5 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-bold text-zinc-100">About</h4>
                <CopyInlineButton text={bio} />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkedInProfileMock;
