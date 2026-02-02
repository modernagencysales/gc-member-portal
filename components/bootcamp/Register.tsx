import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, UserPlus, Loader2, Ticket, Users } from 'lucide-react';
import { validateInviteCode, registerBootcampStudent } from '../../services/bootcamp-supabase';
import { User } from '../../types';
import { BootcampInviteCode } from '../../types/bootcamp-types';

interface RegisterProps {
  initialCode?: string;
  onRegister: (user: User) => void;
  onBackToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ initialCode, onRegister, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState(initialCode || '');
  const [validatedCode, setValidatedCode] = useState<BootcampInviteCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Validate invite code when it changes (debounced)
  useEffect(() => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length < 4) {
      setValidatedCode(null);
      setCodeError(null);
      return;
    }

    const validateCode = async () => {
      setValidating(true);
      setCodeError(null);
      try {
        const validated = await validateInviteCode(code);
        if (validated) {
          setValidatedCode(validated);
          setCodeError(null);
        } else {
          setValidatedCode(null);
          setCodeError('Invalid or expired invite code');
        }
      } catch {
        setValidatedCode(null);
        setCodeError('Failed to validate code');
      } finally {
        setValidating(false);
      }
    };

    const timeout = setTimeout(validateCode, 500);
    return () => clearTimeout(timeout);
  }, [inviteCode]);

  // Validate initial code on mount
  useEffect(() => {
    if (initialCode) {
      setInviteCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !validatedCode) return;

    setLoading(true);
    setError(null);

    try {
      const student = await registerBootcampStudent(email.trim(), inviteCode.trim());

      // Convert bootcamp student to User format for compatibility
      const user: User = {
        id: student.id,
        email: student.email,
        name: student.name || '',
        cohort: student.cohort || 'Global',
        status: (student.accessLevel as 'Full Access' | 'Curriculum Only') || 'Full Access',
      };

      onRegister(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-10 border border-zinc-200 dark:border-zinc-800 animate-slide-in">
        <div className="flex justify-center mb-8">
          <div className="p-4 bg-emerald-500 rounded-lg text-white">
            <UserPlus size={32} />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
            Join the Bootcamp
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Enter your invite code and email to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Invite Code Input */}
          <div>
            <label
              htmlFor="inviteCode"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 px-1"
            >
              Invite Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                <Ticket size={18} />
              </div>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className={`block w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-zinc-900 dark:text-white font-mono tracking-wider ${
                  codeError
                    ? 'border-red-500'
                    : validatedCode
                      ? 'border-emerald-500'
                      : 'border-zinc-200 dark:border-zinc-800'
                }`}
                placeholder="JAN27"
                maxLength={12}
                required
              />
              {validating && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <Loader2 size={18} className="animate-spin text-zinc-400" />
                </div>
              )}
            </div>
            {codeError && <p className="mt-2 text-xs font-medium text-red-500 px-1">{codeError}</p>}
          </div>

          {/* Cohort Display (from validated code) */}
          {validatedCode && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Cohort
                  </p>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    {validatedCode.cohortName || 'Global'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email Input */}
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
                className="block w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-zinc-900 dark:text-white"
                placeholder="your@email.com"
                required
              />
            </div>
            {error && <p className="mt-3 text-xs font-medium text-red-500 px-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !validatedCode}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={onBackToLogin}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            Already have an account? <span className="font-medium">Log in</span>
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Training Portal • &copy; {new Date().getFullYear()} Modern Agency Sales
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
