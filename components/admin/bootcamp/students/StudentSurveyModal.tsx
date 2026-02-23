import React from 'react';
import { X, Building2, Target, Zap, Calendar } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { BootcampStudentSurvey } from '../../../../types/bootcamp-types';

interface StudentSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: BootcampStudentSurvey | null;
  studentName?: string;
}

const StudentSurveyModal: React.FC<StudentSurveyModalProps> = ({
  isOpen,
  onClose,
  survey,
  studentName,
}) => {
  const { isDarkMode } = useTheme();

  if (!isOpen || !survey) return null;

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderList = (items?: string[]) => {
    if (!items || items.length === 0) return <span className="text-zinc-400">None</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`px-2 py-0.5 rounded text-xs ${
              isDarkMode ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-zinc-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div>
            <h2 className="text-lg font-semibold">Survey Responses</h2>
            {studentName && (
              <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {studentName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Completion Info */}
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
              isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Completed: {formatDate(survey.completedAt)}
            </span>
          </div>

          {/* Business Basics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2
                className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}
              />
              <h3 className="font-semibold">Business Basics</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Company
                </label>
                <p className="mt-1 font-medium">{survey.companyName || 'N/A'}</p>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Website
                </label>
                <p className="mt-1 font-medium">
                  {survey.website ? (
                    <a
                      href={survey.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-500 hover:underline"
                    >
                      {survey.website}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Industry
                </label>
                <p className="mt-1 font-medium">{survey.industry || 'N/A'}</p>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Company Size
                </label>
                <p className="mt-1 font-medium">{survey.companySize || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Role/Title
                </label>
                <p className="mt-1 font-medium">{survey.roleTitle || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Goals & Challenges */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h3 className="font-semibold">Goals & Challenges</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Primary Goal
                </label>
                <p className="mt-1">{survey.primaryGoal || 'N/A'}</p>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  LinkedIn Experience
                </label>
                <p className="mt-1 font-medium">{survey.linkedinExperience || 'N/A'}</p>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Biggest Challenges
                </label>
                <div className="mt-2">{renderList(survey.biggestChallenges)}</div>
              </div>
            </div>
          </div>

          {/* Lead Generation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h3 className="font-semibold">Lead Generation</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Target Audience
                </label>
                <p className="mt-1">{survey.targetAudience || 'N/A'}</p>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Monthly Outreach Volume
                </label>
                <p className="mt-1 font-medium">{survey.monthlyOutreachVolume || 'N/A'}</p>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Current Lead Gen Methods
                </label>
                <div className="mt-2">{renderList(survey.currentLeadGenMethods)}</div>
              </div>
              <div>
                <label
                  className={`text-xs uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}
                >
                  Tools Currently Using
                </label>
                <div className="mt-2">{renderList(survey.toolsCurrentlyUsing)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 p-4 border-t ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg font-medium ${
              isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentSurveyModal;
