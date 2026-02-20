import React, { useState } from 'react';
import { signProposal } from '../../services/dfy-service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SigningBlockProps {
  proposalId: string;
  services: Array<{ name: string; description: string }>;
  pricing: { total: string; frequency?: string; paymentTerms?: string };
  roadmap?: Array<{ phase: string | number; title: string; duration: string }>;
  clientAccent: string;
  clientName: string;
}

// ---------------------------------------------------------------------------
// SigningBlock Component
// ---------------------------------------------------------------------------

const SigningBlock: React.FC<SigningBlockProps> = ({
  proposalId,
  services,
  pricing,
  roadmap,
  clientAccent,
  clientName,
}) => {
  const [signedName, setSignedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSign = signedName.trim().length >= 2 && agreed;

  const handleSign = async () => {
    if (!canSign || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await signProposal(proposalId, {
        signed_name: signedName.trim(),
        signed_ip: '', // Server will capture the real IP
        signed_user_agent: navigator.userAgent,
      });

      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <section className="py-20 sm:py-24 px-6 print:break-before-page">
      <div className="max-w-3xl mx-auto">
        <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12 text-center">
          Statement of Work
        </h3>

        {/* ----- SOW Summary Card ----- */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-8 sm:p-10 mb-8">
          {/* Scope */}
          {services.length > 0 && (
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Scope of Services
              </h4>
              <ul className="space-y-2">
                {services.map((service, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-base text-zinc-700 dark:text-zinc-300"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: clientAccent }}
                    />
                    {service.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timeline */}
          {roadmap && roadmap.length > 0 && (
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Timeline
              </h4>
              <div className="space-y-2">
                {roadmap.map((phase, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Phase {phase.phase}: {phase.title}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 font-medium">
                      {phase.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investment */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Investment
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: clientAccent }}>
                {pricing.total}
              </span>
              {pricing.frequency && (
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {pricing.frequency}
                </span>
              )}
            </div>
            {pricing.paymentTerms && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {pricing.paymentTerms}
              </p>
            )}
          </div>

          {/* MSA Link */}
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            This engagement is governed by the{' '}
            <a
              href="/terms/msa"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              style={{ color: clientAccent }}
            >
              Master Service Agreement
            </a>
            .
          </p>
        </div>

        {/* ----- Signature Block ----- */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none p-8 sm:p-10">
          <h4 className="text-lg font-bold mb-6">Sign & Proceed</h4>

          {/* Name Input */}
          <div className="mb-5">
            <label
              htmlFor="signed-name"
              className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2"
            >
              Full Name
            </label>
            <input
              id="signed-name"
              type="text"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              placeholder={clientName || 'Your full legal name'}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-base focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow"
              style={{ focusRingColor: clientAccent } as React.CSSProperties}
              disabled={loading}
            />
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-violet-600 focus:ring-violet-500"
              disabled={loading}
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              I agree to the{' '}
              <a
                href="/terms/msa"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                style={{ color: clientAccent }}
              >
                Master Service Agreement
              </a>{' '}
              and the Statement of Work outlined above.
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Sign Button */}
          <button
            onClick={handleSign}
            disabled={!canSign || loading}
            className="w-full py-4 rounded-xl text-base font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: canSign && !loading ? clientAccent : undefined,
            }}
          >
            {loading ? 'Processing...' : 'Sign & Proceed to Payment'}
          </button>

          {/* Legal Notice */}
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-4 leading-relaxed">
            By clicking &ldquo;Sign &amp; Proceed to Payment&rdquo;, you are applying your
            electronic signature, which has the same legal effect as a handwritten signature under
            applicable law.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SigningBlock;
