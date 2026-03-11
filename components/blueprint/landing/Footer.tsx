/**
 * Footer.tsx
 * Footer for the Blueprint landing page.
 * Static links: copyright, affiliate, privacy policy, terms of service.
 */

import React from 'react';
import { Link } from 'react-router-dom';

// ─── Component ───────────────────────────────────────────────────────────────

const Footer: React.FC = () => (
  <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-8">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-2">
      <p className="text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Modern Agency Sales. All rights reserved.
      </p>
      <Link
        to="/affiliate/apply"
        className="inline-block text-sm text-zinc-400 hover:text-violet-500 transition-colors"
      >
        Become an Affiliate
      </Link>
      <div className="flex justify-center gap-3">
        <Link
          to="/privacy"
          className="text-[11px] text-zinc-400 hover:text-zinc-500 transition-colors"
        >
          Privacy Policy
        </Link>
        <span className="text-[11px] text-zinc-300 dark:text-zinc-700">&middot;</span>
        <Link
          to="/terms"
          className="text-[11px] text-zinc-400 hover:text-zinc-500 transition-colors"
        >
          Terms of Service
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
