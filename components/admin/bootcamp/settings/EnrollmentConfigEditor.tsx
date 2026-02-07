import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEnrollmentConfig } from '../../../../services/bootcamp-supabase';
import { useTheme } from '../../../../context/ThemeContext';
import { Users, Copy, ExternalLink } from 'lucide-react';

const EnrollmentConfigEditor: React.FC = () => {
  const { isDarkMode } = useTheme();

  const { data: config, isLoading } = useQuery({
    queryKey: ['enrollmentConfig'],
    queryFn: fetchEnrollmentConfig,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center gap-3 ${
            isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Users className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          <h3 className="font-semibold">Enrollment Config</h3>
        </div>
        <div className="p-6 text-center">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div
        className={`rounded-xl border overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center gap-3 ${
            isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Users className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          <h3 className="font-semibold">Enrollment Config</h3>
        </div>
        <div className="p-6">
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            No enrollment configuration found. Create one in the database with key
            "enrollment_config".
          </p>
        </div>
      </div>
    );
  }

  const products = Object.entries(config.products);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div
        className={`px-6 py-4 border-b flex items-center gap-3 ${
          isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <Users className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
        <h3 className="font-semibold">Enrollment Config</h3>
      </div>
      <div className="p-6 space-y-6">
        {products.map(([key, product]) => (
          <div
            key={key}
            className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{product.name}</h4>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {key}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Active Cohort
                </span>
                <span className="font-medium">{product.activeCohortName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Invite Code
                </span>
                <div className="flex items-center gap-2">
                  <code
                    className={`px-2 py-0.5 rounded text-xs font-mono ${
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  >
                    {product.activeInviteCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(product.activeInviteCode)}
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                    title="Copy code"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Registration URL
                </span>
                <div className="flex items-center gap-2">
                  <code
                    className={`px-2 py-0.5 rounded text-xs font-mono max-w-[300px] truncate ${
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  >
                    /bootcamp/register?code={product.activeInviteCode}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://modernagencysales.com/bootcamp/register?code=${product.activeInviteCode}`
                      )
                    }
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                    title="Copy full URL"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Permanent Join URL
                </span>
                <div className="flex items-center gap-2">
                  <code
                    className={`px-2 py-0.5 rounded text-xs font-mono ${
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                  >
                    /bootcamp/join?product={key}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(`https://modernagencysales.com/bootcamp/join?product=${key}`)
                    }
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                    title="Copy full URL"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <a
                    href={`https://modernagencysales.com/bootcamp/join?product=${key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                    title="Open link"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}

        {config.lastRotatedAt && (
          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Last rotated: {new Date(config.lastRotatedAt).toLocaleString()}
            {config.lastRotatedBy && ` by ${config.lastRotatedBy}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default EnrollmentConfigEditor;
