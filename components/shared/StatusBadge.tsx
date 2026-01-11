import React from 'react';
import { getStatusColor, STATUS_COLORS } from '../../types/gc-types';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const color = getStatusColor(status);
  const colors = STATUS_COLORS[color];

  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`
        inline-flex items-center font-semibold uppercase tracking-wide rounded-full
        ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}
        ${sizeClasses}
      `}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
