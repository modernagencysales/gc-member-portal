import React, { useState } from 'react';
import { Link2, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface AffiliateLoginProps {
  onLogin: (email: string) => Promise<boolean>;
}

const AffiliateLogin: React.FC<AffiliateLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const success = await onLogin(email.trim());
      if (!success) setError('No active affiliate account found for this email.');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 animate-slide-in">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-violet-500 rounded-lg text-white">
            <Link2 size={32} />
          </div>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Affiliate Portal
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Sign in with your affiliate email.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none text-zinc-900 dark:text-white"
                placeholder="you@company.com"
                required
              />
            </div>
            {error && <p className="mt-3 text-xs font-medium text-red-500 px-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-3 px-4 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        <div className="mt-8 text-center">
          <a
            href="/affiliate/apply"
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Not an affiliate? <span className="font-medium">Apply now</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AffiliateLogin;
