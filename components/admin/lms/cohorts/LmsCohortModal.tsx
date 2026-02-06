import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import {
  LmsCohort,
  LmsCohortFormData,
  LmsCohortStatus,
  CohortOnboardingConfig,
} from '../../../../types/lms-types';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

interface LmsCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LmsCohortFormData) => Promise<void>;
  initialData: LmsCohort | null;
  isLoading: boolean;
}

const LmsCohortModal: React.FC<LmsCohortModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<LmsCohortFormData>({
    name: '',
    description: '',
    status: 'Active',
    startDate: '',
    endDate: '',
  });
  const [showPresentation, setShowPresentation] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        status: initialData.status,
        startDate: initialData.startDate?.toISOString().split('T')[0] || '',
        endDate: initialData.endDate?.toISOString().split('T')[0] || '',
        sidebarLabel: initialData.sidebarLabel || '',
        icon: initialData.icon || '',
        sortOrder: initialData.sortOrder || 0,
        productType: initialData.productType || 'course',
        thrivecartProductId: initialData.thrivecartProductId || '',
        onboardingConfig: initialData.onboardingConfig,
      });
      // Auto-expand sections that have data
      setShowPresentation(!!(initialData.sidebarLabel || initialData.icon));
      setShowProduct(!!initialData.thrivecartProductId);
      setShowOnboarding(!!initialData.onboardingConfig?.enabled);
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'Active',
        startDate: '',
        endDate: '',
      });
      setShowPresentation(false);
      setShowProduct(false);
      setShowOnboarding(false);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'} shadow-xl`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <h3 className="text-lg font-semibold">
            {initialData ? 'Edit Cohort' : 'Create New Cohort'}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Cohort Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cohort 8, Winter 2024"
              required
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description for this cohort..."
              rows={3}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none`}
            />
          </div>

          {/* Status */}
          <div>
            <label
              className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as LmsCohortStatus })
              }
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
            >
              <option value="Active">Active</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Presentation Section */}
          <div
            className={`border rounded-lg ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
          >
            <button
              type="button"
              onClick={() => setShowPresentation(!showPresentation)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-50'
              } rounded-lg`}
            >
              Sidebar & Presentation
              {showPresentation ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {showPresentation && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      Sidebar Label
                    </label>
                    <input
                      type="text"
                      value={formData.sidebarLabel || ''}
                      onChange={(e) => setFormData({ ...formData, sidebarLabel: e.target.value })}
                      placeholder="Display name in sidebar"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      Icon (emoji)
                    </label>
                    <input
                      type="text"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="e.g. 🚀"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                  >
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className={`w-24 px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Section */}
          <div
            className={`border rounded-lg ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
          >
            <button
              type="button"
              onClick={() => setShowProduct(!showProduct)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-50'
              } rounded-lg`}
            >
              Product & Billing
              {showProduct ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {showProduct && (
              <div className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      Product Type
                    </label>
                    <select
                      value={formData.productType || 'course'}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                    >
                      <option value="course">Course</option>
                      <option value="bootcamp">Bootcamp</option>
                      <option value="upsell">Upsell</option>
                      <option value="bundle">Bundle</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      ThriveCart Product ID
                    </label>
                    <input
                      type="text"
                      value={formData.thrivecartProductId || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, thrivecartProductId: e.target.value })
                      }
                      placeholder="e.g., tc_course_27"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Onboarding Section */}
          <div
            className={`border rounded-lg ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}
          >
            <button
              type="button"
              onClick={() => setShowOnboarding(!showOnboarding)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-50'
              } rounded-lg`}
            >
              Onboarding Configuration
              {showOnboarding ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {showOnboarding && (
              <div className="px-4 pb-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.onboardingConfig?.enabled || false}
                    onChange={(e) => {
                      const current = formData.onboardingConfig || {
                        enabled: false,
                        steps: ['welcome', 'complete'],
                      };
                      setFormData({
                        ...formData,
                        onboardingConfig: { ...current, enabled: e.target.checked },
                      });
                    }}
                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Enable per-course onboarding
                  </span>
                </label>

                {formData.onboardingConfig?.enabled && (
                  <>
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        Welcome Message
                      </label>
                      <textarea
                        value={formData.onboardingConfig?.welcomeMessage || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingConfig: {
                              ...formData.onboardingConfig!,
                              welcomeMessage: e.target.value,
                            },
                          })
                        }
                        placeholder="Welcome message shown during onboarding..."
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          isDarkMode
                            ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        } focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        Welcome Video URL
                      </label>
                      <input
                        type="url"
                        value={formData.onboardingConfig?.welcomeVideoUrl || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingConfig: {
                              ...formData.onboardingConfig!,
                              welcomeVideoUrl: e.target.value,
                            },
                          })
                        }
                        placeholder="YouTube or Loom URL"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          isDarkMode
                            ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.onboardingConfig?.surveyEnabled || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingConfig: {
                              ...formData.onboardingConfig!,
                              surveyEnabled: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span
                        className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                      >
                        Include survey step
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.onboardingConfig?.calcomEnabled || false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingConfig: {
                              ...formData.onboardingConfig!,
                              calcomEnabled: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span
                        className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                      >
                        Include Cal.com booking step
                      </span>
                    </label>

                    {formData.onboardingConfig?.calcomEnabled && (
                      <div>
                        <label
                          className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                        >
                          Cal.com Booking URL
                        </label>
                        <input
                          type="url"
                          value={formData.onboardingConfig?.calcomBookingUrl || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onboardingConfig: {
                                ...formData.onboardingConfig!,
                                calcomBookingUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="https://cal.com/your-link"
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            isDarkMode
                              ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                          } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                        />
                      </div>
                    )}

                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        Onboarding Steps (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(formData.onboardingConfig?.steps || []).join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            onboardingConfig: {
                              ...formData.onboardingConfig!,
                              steps: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            },
                          })
                        }
                        placeholder="welcome, video, survey, booking, complete"
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          isDarkMode
                            ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                      />
                      <p
                        className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                      >
                        Available: welcome, video, survey, booking, complete
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Cohort' : 'Create Cohort'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LmsCohortModal;
