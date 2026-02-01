import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  submitAffiliateApplication,
  fetchAffiliateByEmail,
} from '../../services/affiliate-supabase';
import { useBootcampUser } from '../../context/AuthContext';

const AffiliateApply: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const bootcampUser = useBootcampUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [applicationNote, setApplicationNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (bootcampUser) {
      setEmail(bootcampUser.email);
      setName(bootcampUser.name || '');
    }
  }, [bootcampUser]);

  useEffect(() => {
    if (!email) return;
    const check = async () => {
      const existing = await fetchAffiliateByEmail(email);
      if (existing) setAlreadyApplied(true);
    };
    const timeout = setTimeout(check, 500);
    return () => clearTimeout(timeout);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await submitAffiliateApplication({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        bio: bio.trim() || undefined,
        applicationNote: applicationNote.trim() || undefined,
        bootcampStudentId: bootcampUser?.id || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Application failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-500 rounded-lg text-white">
              <CheckCircle size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Application Received
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
            We'll review your application and get back to you soon. You'll receive an email once
            approved.
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-violet-500 hover:text-violet-400 font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 animate-slide-in">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-violet-500 rounded-lg text-white">
            <Users size={32} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Become an Affiliate
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Earn $500 for every person you refer who completes the Bootcamp.
          </p>
        </div>

        {bootcampUser && (
          <div className="mb-6 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
              Bootcamp Student — your info has been pre-filled
            </p>
          </div>
        )}

        {alreadyApplied && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              You've already applied. Check your email for updates.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`block w-full px-4 py-3 rounded-lg border transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full px-4 py-3 rounded-lg border transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`block w-full px-4 py-3 rounded-lg border transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="Acme Inc."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              Short Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className={`block w-full px-4 py-3 rounded-lg border resize-none transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="A brief intro about you (shown on your referral page)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1">
              How will you promote the Bootcamp?
            </label>
            <textarea
              value={applicationNote}
              onChange={(e) => setApplicationNote(e.target.value)}
              rows={3}
              className={`block w-full px-4 py-3 rounded-lg border resize-none transition-all outline-none text-zinc-900 dark:text-white ${
                isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                  : 'bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
              }`}
              placeholder="LinkedIn posts, email list, podcast, word of mouth..."
            />
          </div>

          {error && <p className="text-xs font-medium text-red-500 px-1">{error}</p>}

          <button
            type="submit"
            disabled={loading || alreadyApplied || !name.trim() || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-3 px-4 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Submit Application <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Affiliate Program &middot; &copy; {new Date().getFullYear()} Modern Agency Sales
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateApply;
