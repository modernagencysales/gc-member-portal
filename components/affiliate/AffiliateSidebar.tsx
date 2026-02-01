import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  X,
  Link2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AffiliateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const navItems = [
  { to: '/affiliate/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/affiliate/dashboard/referrals', icon: Users, label: 'My Referrals' },
  { to: '/affiliate/dashboard/payouts', icon: DollarSign, label: 'Payouts' },
  { to: '/affiliate/dashboard/assets', icon: FileText, label: 'Marketing Assets' },
  { to: '/affiliate/dashboard/settings', icon: Settings, label: 'Settings' },
];

const AffiliateSidebar: React.FC<AffiliateSidebarProps> = ({ isOpen, onClose, onLogout }) => {
  const { isDarkMode } = useTheme();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-r`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`h-16 flex items-center justify-between px-4 border-b ${
              isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-violet-500" />
              <span className="font-semibold text-zinc-900 dark:text-white">Affiliate Portal</span>
            </div>
            <button
              onClick={onClose}
              className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'bg-violet-400/10 text-violet-400'
                        : 'bg-violet-100 text-violet-700'
                      : isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className={`p-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AffiliateSidebar;
