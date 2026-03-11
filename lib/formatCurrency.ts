/**
 * formatCurrency. Pure currency formatting utility.
 * Constraint: No side effects, no imports. Accepts cents, returns formatted USD string.
 */

/** Converts a cent value to a human-readable USD string (e.g. 250000 → "$2,500"). */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}
