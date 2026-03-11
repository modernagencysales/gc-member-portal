/** InfoPair. Displays a label/value pair with optional external link. Stateless presentational component. */
import { ExternalLink } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

// ─── Types ─────────────────────────────────────────────
export interface InfoPairProps {
  label: string;
  value: string;
  href?: string;
}

// ─── Component ─────────────────────────────────────────
export default function InfoPair({ label, value, href }: InfoPairProps) {
  const { isDarkMode } = useTheme();
  return (
    <div>
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}
      >
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm font-medium flex items-center gap-1 mt-0.5 ${
            isDarkMode
              ? 'text-violet-400 hover:text-violet-300'
              : 'text-violet-600 hover:text-violet-700'
          }`}
        >
          {value}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <p
          className={`text-sm font-medium mt-0.5 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
