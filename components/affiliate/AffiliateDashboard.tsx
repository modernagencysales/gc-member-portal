import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAffiliate } from '../../hooks/useAffiliate';
import AffiliateSidebar from './AffiliateSidebar';
import AffiliateLogin from './AffiliateLogin';

const AffiliateDashboard: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { affiliate, stats, loading, login, logout } = useAffiliate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!affiliate) {
    return <AffiliateLogin onLogin={login} />;
  }

  return (
    <div
      className={`flex h-screen ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}
    >
      <AffiliateSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`h-16 flex items-center justify-between px-4 border-b shrink-0 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Welcome, {affiliate.name}</div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ affiliate, stats }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
