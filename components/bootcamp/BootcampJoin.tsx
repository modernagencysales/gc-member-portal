import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchEnrollmentConfig } from '../../services/bootcamp-supabase';
import { EnrollmentConfig } from '../../types/bootcamp-types';

const BootcampJoin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<EnrollmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const product = searchParams.get('product');

  useEffect(() => {
    const load = async () => {
      try {
        const cfg = await fetchEnrollmentConfig();
        if (!cfg) {
          setError('Enrollment configuration not found. Please contact support.');
          setLoading(false);
          return;
        }
        setConfig(cfg);

        if (product && cfg.products[product]) {
          const code = cfg.products[product].activeInviteCode;
          navigate(`/bootcamp/register?code=${code}`, { replace: true });
          return;
        }

        setLoading(false);
      } catch {
        setError('Failed to load enrollment information. Please try again.');
        setLoading(false);
      }
    };
    load();
  }, [product, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400">Loading enrollment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="max-w-md text-center p-8">
          <p className="text-red-400 mb-4">{error}</p>
          <a href="/" className="text-violet-400 hover:text-violet-300 text-sm">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  // No product param — show product selection
  if (!product && config) {
    const products = Object.entries(config.products);
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
        <div className="max-w-lg w-full">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Choose Your Program</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">
            Select the bootcamp you'd like to join
          </p>
          <div className="space-y-4">
            {products.map(([key, prod]) => (
              <button
                key={key}
                onClick={() => {
                  const code = prod.activeInviteCode;
                  navigate(`/bootcamp/register?code=${code}`, { replace: true });
                }}
                className="w-full p-6 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-violet-500/50 hover:bg-zinc-900/80 transition-all text-left group"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">
                  {prod.name}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">{prod.activeCohortName}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Product specified but not found in config
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="max-w-md text-center p-8">
        <p className="text-zinc-400 mb-4">
          Program not found. Please check your link and try again.
        </p>
        <a href="/bootcamp/join" className="text-violet-400 hover:text-violet-300 text-sm">
          View all programs
        </a>
      </div>
    </div>
  );
};

export default BootcampJoin;
