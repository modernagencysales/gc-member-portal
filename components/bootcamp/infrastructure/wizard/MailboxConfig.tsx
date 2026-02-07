import { Mail, User, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  domains: { domainName: string }[];
  pattern1: string;
  pattern2: string;
  onPattern1Change: (v: string) => void;
  onPattern2Change: (v: string) => void;
}

export default function MailboxConfig({
  domains,
  pattern1,
  pattern2,
  onPattern1Change,
  onPattern2Change,
}: Props) {
  // Validation logic
  const validatePattern = (pattern: string): string | null => {
    if (!pattern.trim()) return null;

    // Check for leading/trailing special chars
    if (/^[._-]/.test(pattern)) {
      return "Username cannot start with '.', '_', or '-'";
    }
    if (/[._-]$/.test(pattern)) {
      return "Username cannot end with '.', '_', or '-'";
    }

    return null;
  };

  const pattern1Error = validatePattern(pattern1);
  const pattern2Error = validatePattern(pattern2);
  const hasErrors = !!pattern1Error || !!pattern2Error;

  // Generate preview mailboxes
  const previewMailboxes = useMemo(() => {
    const mailboxes: string[] = [];
    const patterns = [pattern1, pattern2].filter((p) => p.trim());

    domains.forEach((domain) => {
      patterns.forEach((pattern) => {
        mailboxes.push(`${pattern}@${domain.domainName}`);
      });
    });

    return mailboxes;
  }, [domains, pattern1, pattern2]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Configure Mailboxes</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enter two name patterns. These will cascade across all your domains.
        </p>
      </div>

      {/* Input Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pattern 1 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Pattern 1
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <User size={16} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              value={pattern1}
              onChange={(e) => onPattern1Change(e.target.value)}
              placeholder="e.g., tim"
              className={`w-full pl-9 pr-3 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
                pattern1Error
                  ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 focus:ring-violet-500/20'
              }`}
            />
          </div>
          {pattern1Error && (
            <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{pattern1Error}</span>
            </div>
          )}
        </div>

        {/* Pattern 2 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Pattern 2
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <User size={16} className="text-zinc-400 dark:text-zinc-500" />
            </div>
            <input
              type="text"
              value={pattern2}
              onChange={(e) => onPattern2Change(e.target.value)}
              placeholder="e.g., tim.keen"
              className={`w-full pl-9 pr-3 py-2.5 rounded-lg border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors ${
                pattern2Error
                  ? 'border-red-300 dark:border-red-800 focus:ring-red-500/20'
                  : 'border-zinc-200 dark:border-zinc-800 focus:ring-violet-500/20'
              }`}
            />
          </div>
          {pattern2Error && (
            <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{pattern2Error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {previewMailboxes.length > 0 && !hasErrors && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-violet-500" />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
              Preview ({previewMailboxes.length} mailboxes)
            </h3>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {previewMailboxes.map((mailbox) => (
              <div
                key={mailbox}
                className="px-3 py-2 rounded-lg bg-violet-500/5 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-900/30"
              >
                <div className="text-sm font-mono text-zinc-900 dark:text-white truncate">
                  {mailbox}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {previewMailboxes.length === 0 && !hasErrors && (
        <div className="p-6 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center">
          <Mail size={24} className="mx-auto text-zinc-400 dark:text-zinc-500" />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter name patterns to preview your mailboxes
          </p>
        </div>
      )}
    </div>
  );
}
