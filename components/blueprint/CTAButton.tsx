import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

// ============================================
// Types
// ============================================

interface CTAButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
  icon?: 'calendar' | 'arrow' | 'none';
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'large';
  subtext?: string;
}

// ============================================
// CTAButton Component
// ============================================

/**
 * Contextual CTA button with violet styling
 * Can scroll to Cal embed section or open external link
 */
const CTAButton: React.FC<CTAButtonProps> = ({
  text,
  onClick,
  className = '',
  icon = 'calendar',
  variant = 'primary',
  size = 'default',
  subtext,
}) => {
  const baseStyles =
    'inline-flex flex-col items-center justify-center gap-0 font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 focus:ring-offset-zinc-950';

  const sizeStyles = size === 'large' ? 'px-8 py-4 text-lg' : 'px-6 py-3 text-base';

  const variantStyles =
    variant === 'primary'
      ? 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-zinc-600';

  const IconComponent = icon === 'calendar' ? Calendar : icon === 'arrow' ? ArrowRight : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
    >
      <span className="inline-flex items-center gap-2">
        <span>{text}</span>
        {IconComponent && <IconComponent className="w-4 h-4" />}
      </span>
      {subtext && <span className="block text-sm font-normal opacity-80 mt-1">{subtext}</span>}
    </button>
  );
};

export default CTAButton;
