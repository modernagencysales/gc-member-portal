import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import UnifiedAdminSidebar from './UnifiedAdminSidebar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { isAdminEmail } from '../../config/adminConfig';
import { Menu } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/admin': 'Admin Dashboard',
  '/admin/courses': 'Courses Overview',
  '/admin/courses/students': 'Student Roster',
  '/admin/courses/curriculum': 'Curriculum Editor',
  '/admin/courses/invite-codes': 'Invite Codes',
  '/admin/courses/surveys': 'Survey Responses',
  '/admin/courses/onboarding': 'Course Onboarding',
  '/admin/courses/ai-tools': 'AI Tool Management',
  '/admin/courses/settings': 'Course Settings',
  '/admin/blueprints': 'Blueprint Management',
  '/admin/gc/tools': 'GC Member Tools',
  '/admin/gc/onboarding': 'GC Onboarding',
  '/admin/affiliates': 'Affiliate Program',
  '/admin/proposals': 'Proposals',
  '/admin/proposals/new': 'New Proposal',
  '/admin/dfy': 'DFY Engagements',
  '/admin/dfy/templates': 'DFY Templates',
};

const UnifiedAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode } = useTheme();
  const { gcMember, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !gcMember) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminEmail(gcMember.email)) {
    return <Navigate to="/login" replace />;
  }

  // Match dynamic routes
  let pageTitle = routeTitles[location.pathname] || 'Admin';
  if (location.pathname.startsWith('/admin/courses/curriculum/')) {
    pageTitle = 'Curriculum Editor';
  } else if (
    location.pathname.match(/^\/admin\/proposals\/[^/]+$/) &&
    location.pathname !== '/admin/proposals/new'
  ) {
    pageTitle = 'Edit Proposal';
  } else if (
    location.pathname.match(/^\/admin\/dfy\/[^/]+$/) &&
    location.pathname !== '/admin/dfy/templates'
  ) {
    pageTitle = 'DFY Engagement Detail';
  }

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <UnifiedAdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className={`h-16 flex items-center justify-between px-4 md:px-6 border-b ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${
                isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
          <div
            className={`text-xs font-medium px-2 py-1 rounded ${
              isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
            }`}
          >
            Admin Mode
          </div>
        </header>

        <main
          className={`flex-1 overflow-y-auto transition-colors ${
            isDarkMode ? 'bg-slate-950' : 'bg-slate-50'
          }`}
        >
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UnifiedAdminLayout;
