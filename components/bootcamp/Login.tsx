import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { verifyUser } from '../../services/airtable';
import { User } from '../../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const user = await verifyUser(email.trim());
    if (user) {
      onLogin(user);
    } else {
      setError('Email not found. Please check your spelling.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-10 border border-slate-100 dark:border-slate-800 animate-slide-in">
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-brand-500 rounded-2xl text-white shadow-lg shadow-brand-500/20">
            <ShieldCheck size={40} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Enter your email to access your training dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none text-slate-900 dark:text-white"
                placeholder="your@email.com"
                required
              />
            </div>
            {error && (
              <p className="mt-3 text-[10px] font-bold text-red-500 uppercase tracking-wide px-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-4 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-slate-900/10 dark:shadow-none"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Log In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
            Training Portal
            <br />
            &copy; 2024 GTM OS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
