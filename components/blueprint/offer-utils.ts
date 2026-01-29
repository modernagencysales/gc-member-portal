import { BlueprintSettings } from '../../types/blueprint-types';
import { OfferData } from './offer-data';

/**
 * Calculate the next Nth weekday of the month from a given date.
 * Example: 3rd Monday = weekday=1, weekOfMonth=3
 */
function calculateNextNthWeekday(weekday: number, weekOfMonth: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Try current month first, then next month
  for (let m = month; m <= month + 2; m++) {
    const actualMonth = m % 12;
    const actualYear = year + Math.floor(m / 12);
    const date = getNthWeekdayOfMonth(actualYear, actualMonth, weekday, weekOfMonth);
    if (date && date > now) {
      return date;
    }
  }

  // Fallback: 30 days from now
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  return fallback;
}

/**
 * Get the Nth occurrence of a weekday in a given month.
 * Returns null if there's no such occurrence (e.g., 5th Monday in a month with only 4).
 */
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date | null {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Days until the first occurrence of the target weekday
  let daysUntilFirst = weekday - firstDayOfWeek;
  if (daysUntilFirst < 0) daysUntilFirst += 7;

  // Day of month for the Nth occurrence
  const dayOfMonth = 1 + daysUntilFirst + (n - 1) * 7;

  const result = new Date(year, month, dayOfMonth);
  // Verify it's still in the same month
  if (result.getMonth() !== month) return null;
  return result;
}

/**
 * Get the next cohort date for an offer type.
 * Priority: DB setting > auto-calculated from offer data
 */
export function getNextCohortDate(
  offerType: 'foundations' | 'engineering',
  settings: BlueprintSettings | null,
  offerData: OfferData
): Date {
  // Check DB settings first
  const dbDate =
    offerType === 'foundations'
      ? settings?.nextCohortDateFoundations
      : settings?.nextCohortDateEngineering;

  if (dbDate) {
    const parsed = new Date(dbDate);
    if (!isNaN(parsed.getTime()) && parsed > new Date()) {
      return parsed;
    }
  }

  // Fall back to auto-calculation
  return calculateNextNthWeekday(offerData.cohortWeekday, offerData.cohortWeekOfMonth);
}

/**
 * Format a cohort date for display.
 * Example: "February 16, 2026"
 */
export function formatCohortDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get the number of days until a cohort date.
 */
export function getDaysUntilCohort(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get spots remaining for an offer type.
 * Returns the DB value or the default from offer data.
 */
export function getSpotsRemaining(
  offerType: 'foundations' | 'engineering',
  settings: BlueprintSettings | null,
  offerData: OfferData
): number {
  const dbSpots =
    offerType === 'foundations'
      ? settings?.spotsRemainingFoundations
      : settings?.spotsRemainingEngineering;

  return dbSpots ?? offerData.spotsTotal;
}
