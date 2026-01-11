import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-2',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        border-slate-300 dark:border-slate-700
        border-t-blue-500
        rounded-full
        animate-spin
        ${className}
      `}
    />
  );
};

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <LoadingSpinner size="md" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
