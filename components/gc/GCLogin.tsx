import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const GCLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginGC } = useAuth();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    const success = await loginGC(email.trim());

    if (!success) {
      setError('Email not found. Please check your email or contact support.');
    }
    setLoading(false);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}
    >
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                : 'bg-gradient-to-br from-blue-500 to-purple-500'
            }`}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1
            className={`text-2xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Growth Collective
          </h1>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Member Portal
          </p>
        </div>

        {/* Login Card */}
        <div
          className={`rounded-2xl p-8 shadow-xl ${
            isDarkMode
              ? 'bg-slate-900/80 border border-slate-800'
              : 'bg-white border border-slate-200'
          }`}
        >
          <div className="text-center mb-6">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Welcome back
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter your email to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@company.com"
                className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20'
                  }
                  border focus:outline-none focus:ring-4
                `}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 dark:text-red-400 text-center py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                ${
                  loading
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25'
                }
                text-white
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bootcamp Link */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Looking for the bootcamp?{' '}
              <a href="/bootcamp" className="text-blue-500 hover:text-blue-600 font-medium">
                Go to Bootcamp
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p
          className={`text-center text-xs mt-6 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}
        >
          Need help?{' '}
          <a href="mailto:support@modernagencysales.com" className="text-blue-500 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default GCLogin;
