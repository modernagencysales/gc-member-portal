import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  Clock,
  AlertCircle,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { ProgressBar } from '../../shared/ProgressBar';
import StatusBadge from '../../shared/StatusBadge';
import { LoadingState } from '../../shared/LoadingSpinner';
import { fetchOnboardingWithProgress, updateMemberProgress } from '../../../services/supabase';
import {
  OnboardingCategoryGroup,
  OnboardingProgressItem,
  ProgressStatus,
} from '../../../types/gc-types';

const OnboardingPage: React.FC = () => {
  const { gcMember } = useAuth();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<OnboardingCategoryGroup[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOnboardingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gcMember]);

  const loadOnboardingData = async () => {
    if (!gcMember) return;

    setLoading(true);
    try {
      const data = await fetchOnboardingWithProgress(gcMember.id, gcMember.plan);
      setCategories(data.categories);
      setTotalProgress(data.totalProgress);

      // Expand first incomplete category by default
      const firstIncomplete = data.categories.find((c) => c.completedCount < c.totalCount);
      if (firstIncomplete) {
        setExpandedCategories(new Set([firstIncomplete.name]));
      }
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const handleStatusChange = async (item: OnboardingProgressItem, newStatus: ProgressStatus) => {
    if (!gcMember) {
      console.error('No gcMember found');
      return;
    }

    console.log('Updating progress:', {
      progressId: item.progressId,
      memberId: gcMember.id,
      itemId: item.id,
      newStatus,
    });

    // Optimistic update - immediately update UI
    setCategories((prevCategories) =>
      prevCategories.map((category) => ({
        ...category,
        items: category.items.map((i) =>
          i.id === item.id ? { ...i, progressStatus: newStatus } : i
        ),
        completedCount: category.items.filter((i) =>
          i.id === item.id ? newStatus === 'Complete' : i.progressStatus === 'Complete'
        ).length,
      }))
    );

    // Update total progress optimistically
    setTotalProgress((_prev) => {
      const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
      const wasComplete = item.progressStatus === 'Complete';
      const willBeComplete = newStatus === 'Complete';
      const currentCompleted = categories.reduce((sum, cat) => sum + cat.completedCount, 0);
      const newCompleted = currentCompleted + (willBeComplete ? 1 : 0) - (wasComplete ? 1 : 0);
      return Math.round((newCompleted / totalItems) * 100);
    });

    setUpdatingItems((prev) => new Set(prev).add(item.id));

    try {
      const result = await updateMemberProgress(item.progressId, gcMember.id, item.id, newStatus);
      console.log('Progress updated successfully:', result);

      // Reload data to get server state
      await loadOnboardingData();
    } catch (error) {
      console.error('Failed to update progress:', error);
      // Revert optimistic update on error
      await loadOnboardingData();
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const toggleComplete = (item: OnboardingProgressItem) => {
    const newStatus = item.progressStatus === 'Complete' ? 'Not Started' : 'Complete';
    handleStatusChange(item, newStatus);
  };

  if (loading) {
    return <LoadingState message="Loading onboarding checklist..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Onboarding Checklist
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Complete these tasks to get the most out of Growth Collective
          </p>
        </div>

        <div className="w-full md:w-64">
          <ProgressBar progress={totalProgress} />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <CategorySection
            key={category.name}
            category={category}
            isExpanded={expandedCategories.has(category.name)}
            onToggle={() => toggleCategory(category.name)}
            onToggleItem={toggleComplete}
            updatingItems={updatingItems}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <HelpCircle
            className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}
          />
          <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
            No onboarding items found
          </p>
        </div>
      )}
    </div>
  );
};

interface CategorySectionProps {
  category: OnboardingCategoryGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onToggleItem: (item: OnboardingProgressItem) => void;
  updatingItems: Set<string>;
  isDarkMode: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  isExpanded,
  onToggle,
  onToggleItem,
  updatingItems,
  isDarkMode,
}) => {
  const isComplete = category.completedCount === category.totalCount;

  return (
    <div
      className={`rounded-xl overflow-hidden border ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Category Header */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
        className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
          isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown
              className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            />
          ) : (
            <ChevronRight
              className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            />
          )}
          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {category.name}
          </span>
          {isComplete && (
            <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
              <Check className="w-3 h-3" />
              Complete
            </span>
          )}
        </div>
        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {category.completedCount}/{category.totalCount}
        </span>
      </button>

      {/* Category Items */}
      {isExpanded && (
        <div
          id={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
          className={`border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}
        >
          {category.items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onToggle={() => onToggleItem(item)}
              isUpdating={updatingItems.has(item.id)}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ChecklistItemProps {
  item: OnboardingProgressItem;
  onToggle: () => void;
  isUpdating: boolean;
  isDarkMode: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  isUpdating,
  isDarkMode,
}) => {
  const isComplete = item.progressStatus === 'Complete';
  const isBlocked = item.progressStatus === 'Blocked';
  const isInProgress = item.progressStatus === 'In Progress';

  const _getStatusIcon = () => {
    if (isComplete) return <Check className="w-4 h-4 text-green-500" />;
    if (isBlocked) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isInProgress) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Circle className={`w-4 h-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />;
  };

  return (
    <div
      className={`px-5 py-4 flex items-start gap-4 border-b last:border-b-0 ${
        isDarkMode ? 'border-slate-800' : 'border-slate-100'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={isUpdating}
        role="checkbox"
        aria-checked={isComplete}
        aria-label={`Mark "${item.item}" as ${isComplete ? 'incomplete' : 'complete'}`}
        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
          ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${
            isComplete
              ? 'bg-green-500 border-green-500'
              : isDarkMode
                ? 'border-slate-600 hover:border-slate-500'
                : 'border-slate-300 hover:border-slate-400'
          }
        `}
      >
        {isComplete && <Check className="w-4 h-4 text-white" aria-hidden="true" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-medium ${
              isComplete
                ? isDarkMode
                  ? 'text-slate-500 line-through'
                  : 'text-slate-400 line-through'
                : isDarkMode
                  ? 'text-white'
                  : 'text-slate-900'
            }`}
          >
            {item.item}
          </h3>
          <StatusBadge status={item.progressStatus} size="sm" />
        </div>

        {item.description && (
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {item.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {item.supportType}
          </span>

          {item.docLink && (
            <a
              href={item.docLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs flex items-center gap-1 ${
                isDarkMode
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              View Guide
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
