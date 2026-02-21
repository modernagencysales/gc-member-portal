import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import {
  ENGAGEMENT_STATUS_CONFIGS,
  DELIVERABLE_STATUS_CONFIGS,
} from '../../../types/dfy-admin-types';

interface Props {
  status: string;
  type: 'engagement' | 'deliverable';
}

const colorMap: Record<string, { light: string; dark: string }> = {
  slate: { light: 'bg-slate-100 text-slate-700', dark: 'bg-slate-800 text-slate-300' },
  green: { light: 'bg-green-100 text-green-700', dark: 'bg-green-900/30 text-green-400' },
  blue: { light: 'bg-blue-100 text-blue-700', dark: 'bg-blue-900/30 text-blue-400' },
  yellow: { light: 'bg-yellow-100 text-yellow-700', dark: 'bg-yellow-900/30 text-yellow-400' },
  purple: { light: 'bg-purple-100 text-purple-700', dark: 'bg-purple-900/30 text-purple-400' },
  emerald: { light: 'bg-emerald-100 text-emerald-700', dark: 'bg-emerald-900/30 text-emerald-400' },
  red: { light: 'bg-red-100 text-red-700', dark: 'bg-red-900/30 text-red-400' },
  orange: { light: 'bg-orange-100 text-orange-700', dark: 'bg-orange-900/30 text-orange-400' },
};

const DfyStatusBadge: React.FC<Props> = ({ status, type }) => {
  const { isDarkMode } = useTheme();
  const configMap = type === 'engagement' ? ENGAGEMENT_STATUS_CONFIGS : DELIVERABLE_STATUS_CONFIGS;
  const config = (configMap as Record<string, { label: string; color: string }>)[status] || {
    label: status,
    color: 'slate',
  };
  const colors = colorMap[config.color] || colorMap.slate;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
        isDarkMode ? colors.dark : colors.light
      }`}
    >
      {config.label}
    </span>
  );
};

export default DfyStatusBadge;
