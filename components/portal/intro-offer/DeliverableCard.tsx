import React from 'react';
import { CheckCircle2, Clock, Circle, AlertCircle, Eye } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import type { DisplayStatus } from '../../../types/intro-offer-types';

interface DeliverableCardProps {
  title: string;
  status: DisplayStatus;
  type: string;
  metadata: Record<string, unknown>;
  deliveredAt: string | null;
}

const statusConfig: Record<
  DisplayStatus,
  {
    label: string;
    Icon: React.ElementType;
    iconClass: string;
    textClass: string;
    darkIconClass: string;
    darkTextClass: string;
  }
> = {
  delivered: {
    label: 'Ready',
    Icon: CheckCircle2,
    iconClass: 'text-green-600',
    textClass: 'text-green-600',
    darkIconClass: 'text-green-400',
    darkTextClass: 'text-green-400',
  },
  in_progress: {
    label: 'Building...',
    Icon: Clock,
    iconClass: 'text-yellow-600',
    textClass: 'text-yellow-600',
    darkIconClass: 'text-yellow-400',
    darkTextClass: 'text-yellow-400',
  },
  pending: {
    label: 'Pending',
    Icon: Circle,
    iconClass: 'text-slate-400',
    textClass: 'text-slate-400',
    darkIconClass: 'text-slate-500',
    darkTextClass: 'text-slate-500',
  },
};

function getViewUrl(type: string, metadata: Record<string, unknown>): string | null {
  switch (type) {
    case 'funnel':
      return (metadata.funnel_url as string) || null;
    case 'heyreach_account':
      return 'https://app.heyreach.io';
    default:
      return null;
  }
}

const DeliverableCard: React.FC<DeliverableCardProps> = ({
  title,
  status,
  type,
  metadata,
  deliveredAt,
}) => {
  const { isDarkMode } = useTheme();
  const config = statusConfig[status] || statusConfig.pending;
  const viewUrl = status === 'delivered' ? getViewUrl(type, metadata) : null;
  const { Icon } = config;

  return (
    <div
      className={`flex items-center justify-between py-3 border-b last:border-0 ${
        isDarkMode ? 'border-slate-700' : 'border-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${isDarkMode ? config.darkIconClass : config.iconClass}`} />
        <span
          className={
            status === 'pending'
              ? isDarkMode
                ? 'text-slate-500'
                : 'text-slate-400'
              : isDarkMode
                ? 'text-slate-200'
                : 'text-slate-900'
          }
        >
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${isDarkMode ? config.darkTextClass : config.textClass}`}>
          {config.label}
        </span>
        {viewUrl && (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-sm ml-2 ${
              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </a>
        )}
      </div>
    </div>
  );
};

export default DeliverableCard;
