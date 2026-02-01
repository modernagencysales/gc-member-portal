import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const AffiliateOnboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startOnboarding = async () => {
    setLoading(true);
    setError(null);

    const saved = localStorage.getItem('affiliate_user');
    if (!saved) {
      setError('Please log in to your affiliate account first.');
      setLoading(false);
      return;
    }

    try {
      const { email } = JSON.parse(saved);
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-account`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (_err) {
      setError('Failed to start Stripe setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-violet-500 rounded-lg text-white">
            <Link2 size={32} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Set Up Payouts
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Connect your Stripe account to receive commission payouts automatically.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Stripe handles all identity verification
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Payouts sent directly to your bank account
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Stripe handles 1099 tax forms automatically
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={startOnboarding}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continue to Stripe'}
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/affiliate/dashboard')}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateOnboard;
