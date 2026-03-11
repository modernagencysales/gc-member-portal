/**
 * useBootcampProgress. Manages student progress state for BootcampApp:
 * completed action items, proof-of-work entries, task notes, and submitted weeks.
 * Persists all state to localStorage keyed by user email. Never touches Supabase
 * or React Router — purely local persistence.
 */

import { useState, useCallback } from 'react';

import { logError } from '../lib/logError';
import type { ProgressSnapshot } from './useBootcampCurriculum';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UseBootcampProgressParams {
  /** The authenticated user's email — used to derive the localStorage key. */
  userEmail: string | null;
  /** Resolves the localStorage key for a given user email. Provided by useBootcampCurriculum. */
  getStorageKey: (email: string) => string;
}

export interface UseBootcampProgressReturn {
  completedItems: Set<string>;
  proofOfWork: Record<string, string>;
  taskNotes: Record<string, string>;
  submittedWeeks: Record<string, boolean>;
  /** Callback for useBootcampCurriculum's onProgressLoaded — hydrates all state at once. */
  setProgressFromLoad: (snapshot: ProgressSnapshot) => void;
  toggleActionItem: (id: string) => void;
  updateProofOfWork: (id: string, proof: string) => void;
  updateTaskNote: (id: string, note: string) => void;
  handleWeekSubmit: (weekId: string) => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useBootcampProgress({
  userEmail,
  getStorageKey,
}: UseBootcampProgressParams): UseBootcampProgressReturn {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set<string>());
  const [proofOfWork, setProofOfWork] = useState<Record<string, string>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<Record<string, boolean>>({});

  // ─── Persistence ─────────────────────────────────────────────────────────────

  /**
   * Write all four progress slices to localStorage under the user's storage key.
   * Called synchronously from every mutation handler after computing the next state.
   * No-ops when userEmail is not yet available (user not authenticated).
   */
  const saveProgress = (
    items: Set<string>,
    proof: Record<string, string>,
    notes: Record<string, string>,
    submitted: Record<string, boolean>
  ): void => {
    if (!userEmail) return;
    const payload = { items: Array.from(items), proof, notes, submitted };
    try {
      localStorage.setItem(getStorageKey(userEmail), JSON.stringify(payload));
    } catch (error) {
      logError('useBootcampProgress:save', error);
    }
  };

  // ─── Hydration ───────────────────────────────────────────────────────────────

  /**
   * Called by useBootcampCurriculum via its onProgressLoaded callback once the
   * cached localStorage snapshot has been parsed. Replaces all four slices in a
   * single synchronous batch (no persistence needed — we're restoring from storage).
   */
  const setProgressFromLoad = useCallback((snapshot: ProgressSnapshot) => {
    setCompletedItems(snapshot.completedItems);
    setProofOfWork(snapshot.proofOfWork);
    setTaskNotes(snapshot.taskNotes);
    setSubmittedWeeks(snapshot.submittedWeeks);
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const toggleActionItem = (id: string): void => {
    const next = new Set<string>(completedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompletedItems(next);
    saveProgress(next, proofOfWork, taskNotes, submittedWeeks);
  };

  const updateProofOfWork = (id: string, proof: string): void => {
    const next = { ...proofOfWork, [id]: proof };
    setProofOfWork(next);
    saveProgress(completedItems, next, taskNotes, submittedWeeks);
  };

  const updateTaskNote = (id: string, note: string): void => {
    const next = { ...taskNotes, [id]: note };
    setTaskNotes(next);
    saveProgress(completedItems, proofOfWork, next, submittedWeeks);
  };

  const handleWeekSubmit = (weekId: string): void => {
    const next = { ...submittedWeeks, [weekId]: true };
    setSubmittedWeeks(next);
    saveProgress(completedItems, proofOfWork, taskNotes, next);
  };

  // ─── Return ──────────────────────────────────────────────────────────────────

  return {
    completedItems,
    proofOfWork,
    taskNotes,
    submittedWeeks,
    setProgressFromLoad,
    toggleActionItem,
    updateProofOfWork,
    updateTaskNote,
    handleWeekSubmit,
  };
}
