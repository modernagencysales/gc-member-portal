import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import StatusBadge from '../shared/StatusBadge';

interface GCHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const GCHeader: React.FC<GCHeaderProps> = ({ onMenuClick, title }) => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();

  return (
    <header
      className={`sticky top-0 z-30 px-4 py-3 border-b transition-colors ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-800 backdrop-blur-sm'
          : 'bg-white/95 border-slate-200 backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Menu Button (mobile) + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {title && (
            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h1>
          )}
        </div>

        {/* Right Side - Status + User */}
        <div className="flex items-center gap-4">
          {gcMember && (
            <>
              <StatusBadge status={gcMember.status} size="sm" />

              {/* Notification Bell (placeholder) */}
              <button
                className={`p-2 rounded-lg transition-colors relative ${
                  isDarkMode
                    ? 'hover:bg-slate-800 text-slate-400'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Bell className="w-5 h-5" />
                {/* Notification dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
              </button>

              {/* User Avatar (desktop) */}
              <div className="hidden md:flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {gcMember.name?.charAt(0)?.toUpperCase() ||
                    gcMember.email.charAt(0).toUpperCase()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default GCHeader;
