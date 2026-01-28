import React from 'react';

interface SectionBridgeProps {
  text: string;
  variant?: 'default' | 'accent' | 'gradient';
  className?: string;
}

const SectionBridge: React.FC<SectionBridgeProps> = ({
  text,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-zinc-950',
    accent: 'bg-violet-500/5',
    gradient: 'bg-gradient-to-b from-violet-950/10 to-transparent',
  };

  return (
    <div className={`py-12 sm:py-16 px-4 ${variantStyles[variant]} ${className}`}>
      <p className="text-xl sm:text-2xl md:text-3xl text-zinc-300 text-center max-w-3xl mx-auto leading-relaxed font-light">
        {text}
      </p>
    </div>
  );
};

export default SectionBridge;
