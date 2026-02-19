import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../../context/ThemeContext';
import { BootcampStudent, BootcampStudentStatus } from '../../../../types/bootcamp-types';
import { fetchActiveLmsCohorts } from '../../../../services/lms-supabase';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<BootcampStudent>, enrolledCohortIds: string[]) => Promise<void>;
  initialData?: BootcampStudent | null;
  isLoading?: boolean;
  initialEnrolledCohortIds?: string[];
}

const STATUS_OPTIONS: BootcampStudentStatus[] = [
  'Onboarding',
  'Active',
  'Completed',
  'Paused',
  'Churned',
];

const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  initialEnrolledCohortIds = [],
}) => {
  const { isDarkMode } = useTheme();

  // Fetch cohorts from LMS
  const { data: cohorts = [] } = useQuery({
    queryKey: ['lms', 'cohorts', 'active'],
    queryFn: fetchActiveLmsCohorts,
  });

  const [formData, setFormData] = useState<Partial<BootcampStudent>>({
    email: '',
    name: '',
    company: '',
    cohort: 'Global',
    status: 'Onboarding',
    accessLevel: 'Full Access',
    notes: '',
  });

  const [selectedCohortIds, setSelectedCohortIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email,
        name: initialData.name || '',
        company: initialData.company || '',
        cohort: initialData.cohort,
        status: initialData.status,
        accessLevel: initialData.accessLevel,
        notes: initialData.notes || '',
      });
      setSelectedCohortIds(new Set(initialEnrolledCohortIds));
    } else {
      setFormData({
        email: '',
        name: '',
        company: '',
        cohort: 'Global',
        status: 'Onboarding',
        accessLevel: 'Full Access',
        notes: '',
      });
      setSelectedCohortIds(new Set());
    }
  }, [initialData, isOpen, initialEnrolledCohortIds]);

  const toggleCohort = (cohortId: string) => {
    setSelectedCohortIds((prev) => {
      const next = new Set(prev);
      if (next.has(cohortId)) {
        next.delete(cohortId);
      } else {
        next.add(cohortId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, Array.from(selectedCohortIds));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-xl ${
          isDarkMode ? 'bg-slate-900' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b shrink-0 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <h2 className="text-lg font-semibold">
            {initialData ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!initialData}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white disabled:bg-slate-800/50'
                  : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-50'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Enrolled Courses</label>
            <div
              className={`rounded-lg border p-3 space-y-2 max-h-40 overflow-y-auto ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
              }`}
            >
              {cohorts.length === 0 ? (
                <p className="text-sm text-slate-500">No active courses</p>
              ) : (
                cohorts.map((cohort) => (
                  <label
                    key={cohort.id}
                    className={`flex items-center gap-2.5 p-1.5 rounded cursor-pointer ${
                      isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCohortIds.has(cohort.id)}
                      onChange={() => toggleCohort(cohort.id)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{cohort.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as BootcampStudentStatus })
              }
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Access Level</label>
            <select
              value={formData.accessLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  accessLevel: e.target.value as BootcampStudent['accessLevel'],
                })
              }
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="Full Access">Full Access</option>
              <option value="Sprint + AI Tools">Sprint + AI Tools</option>
              <option value="Curriculum Only">Curriculum Only</option>
              <option value="Lead Magnet">Lead Magnet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-lg border resize-none ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${
                isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
