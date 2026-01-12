import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Wrench,
  Target,
  Users,
  BookOpen,
  Moon,
  Sun,
  LogOut,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ProgressBar } from '../shared/ProgressBar';
import { isAdminEmail } from '../../config/adminConfig';

interface GCSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onboardingProgress?: number;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/onboarding', icon: CheckSquare, label: 'Onboarding' },
  { path: '/tools', icon: Wrench, label: 'My Tools' },
  { path: '/campaigns', icon: Target, label: 'Campaigns' },
  { path: '/icp', icon: Users, label: 'ICP & Positioning' },
  { path: '/resources', icon: BookOpen, label: 'Resources' },
];

const GCSidebar: React.FC<GCSidebarProps> = ({ isOpen, onClose, onboardingProgress = 0 }) => {
  const { gcMember, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}
          border-r
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-900 dark:text-white">
                  Growth Collective
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Member Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="md:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* User Info */}
        {gcMember && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {gcMember.name?.charAt(0)?.toUpperCase() || gcMember.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                  {gcMember.name || gcMember.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {gcMember.company || gcMember.email}
                </p>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="mt-3">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                  gcMember.plan === 'Full ($1000/mo)'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {gcMember.plan.replace(' ($1000/mo)', '').replace(' ($600/mo)', '')} Plan
              </span>
            </div>
          </div>
        )}

        {/* Onboarding Progress */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <ProgressBar progress={onboardingProgress} size="sm" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? isDarkMode
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-blue-50 text-blue-700'
                    : isDarkMode
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          {/* Admin Link - only for admins */}
          {gcMember && isAdminEmail(gcMember.email) && (
            <a
              href="/admin"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isDarkMode
                  ? 'text-amber-400 hover:bg-amber-900/20'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              <Shield className="w-5 h-5" />
              Admin Dashboard
            </a>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* Bootcamp Link */}
          <a
            href="/bootcamp"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isDarkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Go to Bootcamp
          </a>

          {/* Logout */}
          <button
            onClick={handleLogout}
            aria-label="Sign out of your account"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default GCSidebar;
