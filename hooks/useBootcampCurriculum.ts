/**
 * useBootcampCurriculum. Loads and manages curriculum data (course structure,
 * current lesson, loading state) for BootcampApp.
 * Never imports React Router components, UI elements, or progress state.
 */

import { useState, useRef } from 'react';
import { fetchStudentCurriculumAsLegacy } from '../services/lms-supabase';
import { logError } from '../lib/logError';
import type { CourseData, Lesson, User } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ProgressSnapshot {
  completedItems: Set<string>;
  proofOfWork: Record<string, string>;
  taskNotes: Record<string, string>;
  submittedWeeks: Record<string, boolean>;
}

export interface UseBootcampCurriculumParams {
  onProgressLoaded: (data: ProgressSnapshot) => void;
}

export interface UseBootcampCurriculumReturn {
  courseData: CourseData | null;
  currentLesson: Lesson | null;
  setCurrentLesson: (lesson: Lesson | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  loadError: string | null;
  loadUserData: (activeUser: User, cohortNameOverride?: string) => Promise<void>;
  getStorageKey: (email: string) => string;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages curriculum fetch lifecycle: resolves the storage key, reads cached
 * progress from localStorage (delegating to `onProgressLoaded`), fetches the
 * course structure from Supabase, and sets the initial lesson.
 *
 * A `loadRequestRef` counter guards against race conditions when enrollment
 * changes trigger concurrent loads.
 */
export function useBootcampCurriculum({
  onProgressLoaded,
}: UseBootcampCurriculumParams): UseBootcampCurriculumReturn {
  const loadRequestRef = useRef(0);

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getStorageKey = (email: string): string => {
    const domain = email.split('@')[1] || 'global';
    return `lms_progress_v2_${domain}`;
  };

  // ─── Data Loader ────────────────────────────────────────────────────────────

  const loadUserData = async (activeUser: User, cohortNameOverride?: string): Promise<void> => {
    const thisLoadId = ++loadRequestRef.current;
    setLoading(true);

    // Read cached progress from localStorage and surface to parent via callback
    const storageKey = getStorageKey(activeUser.email);
    const storedProgress = localStorage.getItem(storageKey);

    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        onProgressLoaded({
          completedItems: new Set<string>(parsed.items ?? []),
          proofOfWork: parsed.proof ?? {},
          taskNotes: parsed.notes ?? {},
          submittedWeeks: parsed.submitted ?? {},
        });
      } catch (e) {
        logError('useBootcampCurriculum:loadProgress', e);
        onProgressLoaded({
          completedItems: new Set<string>(),
          proofOfWork: {},
          taskNotes: {},
          submittedWeeks: {},
        });
      }
    } else {
      onProgressLoaded({
        completedItems: new Set<string>(),
        proofOfWork: {},
        taskNotes: {},
        submittedWeeks: {},
      });
    }

    const cohortName = cohortNameOverride ?? activeUser.cohort;

    try {
      setLoadError(null);

      const data = await fetchStudentCurriculumAsLegacy(cohortName, activeUser.email);

      // Discard stale results if a newer load has started (race condition guard)
      if (loadRequestRef.current !== thisLoadId) return;

      setCourseData(data);

      // Lead Magnet users with no content grants should land on My Blueprint, not Week 1
      if (activeUser.status === 'Lead Magnet') {
        setCurrentLesson({
          id: 'my-blueprint',
          title: 'My Blueprint',
          embedUrl: 'virtual:my-blueprint',
        });
      } else if (data.weeks.length > 0 && data.weeks[0].lessons.length > 0) {
        setCurrentLesson(data.weeks[0].lessons[0]);
      } else {
        // Fallback: no lessons available yet
        setCurrentLesson({
          id: 'no-content',
          title: 'No Content Available',
          embedUrl: '',
        });
      }
    } catch (error) {
      logError('useBootcampCurriculum:loadCurriculum', error);
      if (loadRequestRef.current !== thisLoadId) return;
      setLoadError('Unable to load your content. Please refresh the page to try again.');
    } finally {
      if (loadRequestRef.current === thisLoadId) {
        setLoading(false);
      }
    }
  };

  return {
    courseData,
    currentLesson,
    setCurrentLesson,
    loading,
    setLoading,
    loadError,
    loadUserData,
    getStorageKey,
  };
}
