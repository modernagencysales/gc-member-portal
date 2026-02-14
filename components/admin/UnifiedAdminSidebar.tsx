import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  ListChecks,
  Settings,
  ArrowLeft,
  X,
  Shield,
  FolderKanban,
  Ticket,
  Bot,
  BookOpen,
  ClipboardList,
  Wrench,
  FileText,
  Award,
  Package,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface UnifiedAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  label: string;
  items: { to: string; icon: React.ElementType; label: string; end?: boolean }[];
}

const sections: NavSection[] = [
  {
    label: 'Courses',
    items: [
      { to: '/admin/courses', icon: FolderKanban, label: 'Overview', end: true },
      { to: '/admin/courses/students', icon: Users, label: 'Students' },
      { to: '/admin/courses/curriculum', icon: BookOpen, label: 'Curriculum' },
      { to: '/admin/courses/invite-codes', icon: Ticket, label: 'Invite Codes' },
      { to: '/admin/courses/surveys', icon: ClipboardList, label: 'Surveys' },
      { to: '/admin/courses/onboarding', icon: ListChecks, label: 'Onboarding' },
      { to: '/admin/courses/ai-tools', icon: Bot, label: 'AI Tools' },
      { to: '/admin/courses/settings', icon: Settings, label: 'Settings' },
    ],
  },
  {
    label: 'Blueprints',
    items: [{ to: '/admin/blueprints', icon: FileText, label: 'Prospects' }],
  },
  {
    label: 'GC Portal',
    items: [
      { to: '/admin/gc/tools', icon: Wrench, label: 'Member Tools' },
      { to: '/admin/gc/onboarding', icon: ListChecks, label: 'Member Onboarding' },
    ],
  },
  {
    label: 'Intro Offers',
    items: [{ to: '/admin/intro-offers', icon: Package, label: 'Offers', end: true }],
  },
  {
    label: 'Affiliates',
    items: [{ to: '/admin/affiliates', icon: Award, label: 'Program' }],
  },
];

const UnifiedAdminSidebar: React.FC<UnifiedAdminSidebarProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-r`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={`h-16 flex items-center justify-between px-4 border-b ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className="font-semibold">Admin Panel</span>
            </div>
            <button
              onClick={onClose}
              className={`lg:hidden p-2 rounded-lg ${
                isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-5">
            {sections.map((section) => (
              <div key={section.label}>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-wider mb-2 px-3 ${
                    isDarkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? isDarkMode
                              ? 'bg-amber-900/30 text-amber-400'
                              : 'bg-amber-100 text-amber-700'
                            : isDarkMode
                              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Back to Portal */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={() => navigate('/portal')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Portal
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default UnifiedAdminSidebar;
