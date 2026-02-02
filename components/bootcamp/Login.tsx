import React, { useState } from 'react';
import { Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { verifyUser } from '../../services/airtable';
import { verifyBootcampStudent } from '../../services/bootcamp-supabase';
import { User } from '../../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegisterClick?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegisterClick }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    // Try Supabase first (new bootcamp students)
    const bootcampStudent = await verifyBootcampStudent(email.trim());
    if (bootcampStudent) {
      // Convert bootcamp student to User format for compatibility
      const user: User = {
        id: bootcampStudent.id,
        email: bootcampStudent.email,
        name: bootcampStudent.name || '',
        cohort: bootcampStudent.cohort || 'Global',
        status: (bootcampStudent.accessLevel as 'Full Access' | 'Curriculum Only') || 'Full Access',
      };
      onLogin(user);
      setLoading(false);
      return;
    }

    // Fall back to Airtable (legacy users)
    const user = await verifyUser(email.trim());
    if (user) {
      onLogin(user);
    } else {
      setError('Email not found. Please check your spelling.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 animate-slide-in">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-violet-500 rounded-lg text-white">
            <ShieldCheck size={32} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Enter your email to access your training dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none text-zinc-900 dark:text-white"
                placeholder="your@email.com"
                required
              />
            </div>
            {error && <p className="mt-3 text-xs font-medium text-red-500 px-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-3 px-4 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50"
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

        {onRegisterClick && (
          <div className="mt-8 text-center">
            <button
              onClick={onRegisterClick}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              Don't have an account? <span className="font-medium">Register</span>
            </button>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Training Portal • &copy; {new Date().getFullYear()} Modern Agency Sales
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
