import React from 'react';
import { ClientLogo } from '../../services/blueprint-supabase';

interface LogoBarProps {
  logos: ClientLogo[];
  maxLogos?: number;
}

const LogoBar: React.FC<LogoBarProps> = ({ logos, maxLogos }) => {
  if (logos.length === 0) return null;

  const displayLogos = maxLogos ? logos.slice(0, maxLogos) : logos;

  return (
    <div className="py-8">
      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-center mb-6">
        Trusted by leaders at
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10">
        {displayLogos.map((logo) => (
          <div key={logo.id} className="flex-shrink-0">
            <img
              src={logo.imageUrl}
              alt={logo.name}
              className="h-8 sm:h-10 w-auto object-contain grayscale opacity-70 dark:invert dark:opacity-60 hover:opacity-90 dark:hover:opacity-80 transition-all duration-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoBar;
