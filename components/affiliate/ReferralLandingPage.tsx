import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, CheckCircle, Star } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { fetchAffiliateBySlug } from '../../services/affiliate-supabase';
import { setReferralCookie } from '../../lib/referral-cookie';
import { Affiliate } from '../../types/affiliate-types';

const ReferralLandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const aff = await fetchAffiliateBySlug(slug);
        if (aff) {
          setAffiliate(aff);
          setReferralCookie(aff.code);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (notFound || !affiliate) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Page Not Found
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            This referral link is no longer active.
          </p>
        </div>
      </div>
    );
  }

  const handleCTA = () => {
    navigate('/blueprint');
  };

  const benefits = [
    'Build your LinkedIn Authority Blueprint',
    'Weekly live coaching sessions',
    'AI-powered content generation tools',
    'Proven lead generation frameworks',
    'Private community of B2B founders',
    'Lifetime access to all course materials',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-12">
        <div className="text-center mb-12">
          {affiliate.photoUrl && (
            <img
              src={affiliate.photoUrl}
              alt={affiliate.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-violet-500"
            />
          )}
          <p className="text-sm text-violet-500 font-medium mb-2">Referred by</p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{affiliate.name}</h2>
          {affiliate.company && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{affiliate.company}</p>
          )}
          {affiliate.bio && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-md mx-auto">
              {affiliate.bio}
            </p>
          )}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            LinkedIn Authority Bootcamp
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            The proven system for B2B founders to generate leads, build authority, and close deals
            on LinkedIn.
          </p>
        </div>

        <div
          className={`rounded-xl border p-6 mb-8 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-violet-500" />
            What You Get
          </h3>
          <div className="space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-zinc-400 mt-3">
            Join hundreds of B2B founders already generating leads on LinkedIn.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 py-8 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} Modern Agency Sales
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 md:hidden">
        <button
          onClick={handleCTA}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg transition-colors"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ReferralLandingPage;
