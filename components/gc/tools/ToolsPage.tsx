import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Eye, EyeOff, AlertCircle, Wrench } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import StatusBadge from '../../shared/StatusBadge';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchMemberTools } from '../../../services/supabase';
import { ToolAccess } from '../../../types/gc-types';

// Tool icons/colors mapping
const toolColors: Record<string, { bg: string; darkBg: string; icon: string }> = {
  Clay: { bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30', icon: '🧱' },
  Smartlead: { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', icon: '📧' },
  HeyReach: { bg: 'bg-purple-100', darkBg: 'dark:bg-purple-900/30', icon: '🤝' },
  Apify: { bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', icon: '🤖' },
  'Anthropic API': { bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', icon: '🧠' },
  'Gemini API': { bg: 'bg-cyan-100', darkBg: 'dark:bg-cyan-900/30', icon: '✨' },
  Zapmail: { bg: 'bg-rose-100', darkBg: 'dark:bg-rose-900/30', icon: '⚡' },
  Mailforge: { bg: 'bg-indigo-100', darkBg: 'dark:bg-indigo-900/30', icon: '🔥' },
  'Linked Helper': { bg: 'bg-sky-100', darkBg: 'dark:bg-sky-900/30', icon: '🔗' },
};

const ToolsPage: React.FC = () => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<ToolAccess[]>([]);

  useEffect(() => {
    const loadTools = async () => {
      if (!gcMember) return;

      setLoading(true);
      try {
        const data = await fetchMemberTools(gcMember.id);
        setTools(data);
      } catch (error) {
        console.error('Failed to load tools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, [gcMember]);

  if (loading) {
    return <LoadingState message="Loading your tools..." />;
  }

  const activeTools = tools.filter((t) => t.status === 'Active');
  const pendingTools = tools.filter((t) => t.status === 'Pending' || t.status === 'Not Set Up');
  const issueTools = tools.filter((t) => t.status === 'Issues');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          My Tools
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Access credentials and login information for your tools
        </p>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 flex-wrap">
        <StatPill label="Active" count={activeTools.length} color="green" isDarkMode={isDarkMode} />
        <StatPill
          label="Pending Setup"
          count={pendingTools.length}
          color="yellow"
          isDarkMode={isDarkMode}
        />
        {issueTools.length > 0 && (
          <StatPill label="Issues" count={issueTools.length} color="red" isDarkMode={isDarkMode} />
        )}
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} isDarkMode={isDarkMode} />
        ))}
      </div>

      {tools.length === 0 && (
        <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <Wrench
            className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
          />
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
            No tools have been set up yet
          </p>
        </div>
      )}
    </div>
  );
};

interface StatPillProps {
  label: string;
  count: number;
  color: 'green' | 'yellow' | 'red';
  isDarkMode: boolean;
}

const StatPill: React.FC<StatPillProps> = ({ label, count, color, isDarkMode }) => {
  const colors = {
    green: isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700',
    yellow: isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
    red: isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${colors[color]}`}>
      {count} {label}
    </span>
  );
};

interface ToolCardProps {
  tool: ToolAccess;
  isDarkMode: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, isDarkMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const colors = toolColors[tool.tool] || {
    bg: 'bg-slate-100',
    darkBg: 'dark:bg-slate-800',
    icon: '🔧',
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      className={`rounded-xl p-5 border ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colors.bg} ${colors.darkBg}`}
          >
            {colors.icon}
          </div>
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {tool.tool}
            </h3>
            <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {tool.accessType}
            </span>
          </div>
        </div>
        <StatusBadge status={tool.status} size="sm" />
      </div>

      {/* Credentials */}
      {tool.status === 'Active' && (tool.username || tool.password) && (
        <div className="space-y-3 mb-4">
          {tool.username && (
            <CredentialField
              label="Username"
              value={tool.username}
              onCopy={() => copyToClipboard(tool.username!, 'username')}
              isCopied={copied === 'username'}
              isDarkMode={isDarkMode}
            />
          )}
          {tool.password && (
            <CredentialField
              label="Password"
              value={showPassword ? tool.password : '••••••••'}
              onCopy={() => copyToClipboard(tool.password!, 'password')}
              isCopied={copied === 'password'}
              isDarkMode={isDarkMode}
              isPassword
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          )}
        </div>
      )}

      {/* Notes */}
      {tool.notes && (
        <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {tool.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {tool.loginUrl && (
          <a
            href={tool.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Login
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {tool.setupDoc && tool.status !== 'Active' && (
          <a
            href={tool.setupDoc}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Setup Guide
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Issue Alert */}
      {tool.status === 'Issues' && (
        <div className="mt-4 flex items-center gap-2 text-xs text-red-500">
          <AlertCircle className="w-4 h-4" />
          Contact support if you need help with this tool
        </div>
      )}
    </div>
  );
};

interface CredentialFieldProps {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  isDarkMode: boolean;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

const CredentialField: React.FC<CredentialFieldProps> = ({
  label,
  value,
  onCopy,
  isCopied,
  isDarkMode,
  isPassword,
  showPassword,
  onTogglePassword,
}) => (
  <div>
    <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
    <div
      className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-lg ${
        isDarkMode ? 'bg-slate-800' : 'bg-slate-50'
      }`}
    >
      <span
        className={`flex-1 text-sm font-mono truncate ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        {value}
      </span>
      {isPassword && onTogglePassword && (
        <button
          onClick={onTogglePassword}
          className={`p-1 rounded ${
            isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
          }`}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
      <button
        onClick={onCopy}
        className={`p-1 rounded ${
          isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
        }`}
      >
        {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

export default ToolsPage;
