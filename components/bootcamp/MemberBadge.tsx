import React from 'react';
import { Crown } from 'lucide-react';

interface MemberBadgeProps {
  className?: string;
}

const MemberBadge: React.FC<MemberBadgeProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ${className}`}
    >
      <Crown className="w-3 h-3" />
      Member
    </span>
  );
};

export default MemberBadge;
