import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  inline?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ inline = false }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark(!isDark)}
      className={
        inline
          ? 'p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors'
          : 'fixed top-4 right-4 z-[60] p-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 shadow-md transition-colors'
      }
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className={inline ? 'w-4 h-4 text-zinc-400' : 'w-5 h-5 text-zinc-400'} />
      ) : (
        <Moon className={inline ? 'w-4 h-4 text-zinc-600' : 'w-5 h-5 text-zinc-600'} />
      )}
    </button>
  );
};

export default ThemeToggle;
