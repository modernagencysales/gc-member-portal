/**
 * Admin Configuration
 * Controls access to the admin dashboard at /admin routes
 */

// Add authorized admin emails here
export const ADMIN_EMAILS: string[] = import.meta.env.VITE_ADMIN_EMAILS?.split(',') ?? [
  'kristaps@peak9.co',
  'tim@keen.digital',
];

/**
 * Check if an email has admin access
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase());
}
