/**
 * NavBar.tsx
 * Navigation bar for the Blueprint landing page.
 * No props required — all links are static.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

// ─── Component ───────────────────────────────────────────────────────────────

const NavBar: React.FC = () => (
  <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Modern Agency Sales
      </span>
      <div className="flex items-center gap-3 sm:gap-5">
        <Link
          to="/programs"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          What We Do
        </Link>
        <Link
          to="/case-studies"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Case Studies
        </Link>
        <Link
          to="/affiliate/apply"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Affiliates
        </Link>
        <Link
          to="/login"
          className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          Login
        </Link>
        <ThemeToggle inline />
      </div>
    </div>
  </nav>
);

export default NavBar;
