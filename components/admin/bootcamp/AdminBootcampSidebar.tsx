import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  ListChecks,
  Settings,
  ArrowLeft,
  X,
  GraduationCap,
  FolderKanban,
  Ticket,
  Bot,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

interface AdminBootcampSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/admin/bootcamp/students', icon: Users, label: 'Student Roster' },
  { to: '/admin/bootcamp/surveys', icon: ClipboardList, label: 'Survey Responses' },
  { to: '/admin/lms/cohorts', icon: FolderKanban, label: 'Cohorts' },
  { to: '/admin/lms/curriculum', icon: BookOpen, label: 'Curriculum' },
  { to: '/admin/bootcamp/invite-codes', icon: Ticket, label: 'Invite Codes' },
  { to: '/admin/bootcamp/onboarding', icon: ListChecks, label: 'Onboarding Checklist' },
  { to: '/admin/bootcamp/ai-tools', icon: Bot, label: 'AI Tools' },
  { to: '/admin/bootcamp/settings', icon: Settings, label: 'Settings' },
];

const AdminBootcampSidebar: React.FC<AdminBootcampSidebarProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

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
              <GraduationCap
                className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
              />
              <span className="font-semibold">Bootcamp Admin</span>
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
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? isDarkMode
                        ? 'bg-blue-900/30 text-blue-400'
                        : 'bg-blue-100 text-blue-700'
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

          {/* Back to Main Admin */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={handleBackToAdmin}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Admin
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminBootcampSidebar;
