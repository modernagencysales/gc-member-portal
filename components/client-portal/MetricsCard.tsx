import React from 'react';

interface MetricsCardProps {
  label: string;
  value: string | number;
  subtext?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ label, value, subtext }) => {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{subtext}</p>}
    </div>
  );
};

export default MetricsCard;
