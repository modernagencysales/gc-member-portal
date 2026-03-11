/** useBootcampAuth. Manages user auth state and handlers for BootcampApp. Never imports React Router components or UI elements. */

import { useState, useEffect, useRef, MutableRefObject, Dispatch, SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { verifyBootcampStudent, redeemCode } from '../services/bootcamp-supabase';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { BootcampStudent } from '../types/bootcamp-types';

// ─── Return Interface ─────────────────────────────────────────────────────────

export interface UseBootcampAuthReturn {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  bootcampStudent: BootcampStudent | null;
  setBootcampStudent: Dispatch<SetStateAction<BootcampStudent | null>>;
  showRegister: boolean;
  setShowRegister: (v: boolean) => void;
  handleLogin: (user: User) => void;
  handleRegister: (user: User) => void;
  handleLogout: () => void;
  handleStudentUpdate: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Callbacks are passed as MutableRefObjects so the component can create them
 * before the hook call (before dependent hooks like useStudentGrants run) and
 * update the refs each render — avoiding temporal dead zone errors.
 */
export interface UseBootcampAuthOptions {
  /** Ref to callback invoked after a successful code auto-redeem. */
  refetchGrantsRef?: MutableRefObject<(() => void) | undefined>;
  /** Ref to callback invoked after login/register to load curriculum data. */
  loadUserDataRef?: MutableRefObject<((user: User) => void) | undefined>;
  /**
   * Called with `false` once the auth init effect completes (mirrors the
   * `setLoading(false)` that was previously inline in the init useEffect).
   */
  setLoading?: (loading: boolean) => void;
}

export function useBootcampAuth(options: UseBootcampAuthOptions = {}): UseBootcampAuthReturn {
  const { refetchGrantsRef, loadUserDataRef, setLoading } = options;
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for invite code in URL
  const inviteCodeFromUrl = searchParams.get('code');

  // Registration mode state - check URL directly on init
  const [showRegister, setShowRegister] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('code') || window.location.pathname.includes('/register');
  });

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [bootcampStudent, setBootcampStudent] = useState<BootcampStudent | null>(null);

  // Stable ref to setLoading so the init effect doesn't close over a stale value
  const setLoadingRef = useRef(setLoading);
  useEffect(() => {
    setLoadingRef.current = setLoading;
  });

  // Auto-load user from localStorage on mount
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('lms_user_obj');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Try to find in Supabase first
          const student = await verifyBootcampStudent(parsedUser.email);
          if (student) {
            setBootcampStudent(student);
          }

          await loadUserDataRef?.current?.(parsedUser);
        } catch {
          localStorage.removeItem('lms_user_obj');
        }
      }
      setLoadingRef.current?.(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redeem code from URL when logged in
  useEffect(() => {
    const autoRedeem = async () => {
      if (!bootcampStudent || !inviteCodeFromUrl) return;

      try {
        const result = await redeemCode(bootcampStudent.id, inviteCodeFromUrl);
        // Refresh grants after successful redeem
        refetchGrantsRef?.current?.();

        // Update user access level if upgraded
        if (result.accessUpgraded && user) {
          const updatedUser: User = { ...user, status: 'Full Access' };
          setUser(updatedUser);
          localStorage.setItem('lms_user_obj', JSON.stringify(updatedUser));

          const student = await verifyBootcampStudent(user.email);
          if (student) setBootcampStudent(student);
        }

        // Clear the code param from URL
        setSearchParams({});
      } catch {
        // Silently ignore (already redeemed or invalid)
        setSearchParams({});
      }
    };

    autoRedeem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootcampStudent?.id, inviteCodeFromUrl]);

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lms_user_obj', JSON.stringify(newUser));

    // Check if user exists in Supabase
    const student = await verifyBootcampStudent(newUser.email);
    if (student) {
      setBootcampStudent(student);
    }

    loadUserDataRef?.current?.(newUser);
  };

  const handleRegister = async (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('lms_user_obj', JSON.stringify(newUser));

    // Get the newly created student from Supabase
    const student = await verifyBootcampStudent(newUser.email);
    if (student) {
      setBootcampStudent(student);
    }

    // Clear the invite code from URL
    setSearchParams({});

    loadUserDataRef?.current?.(newUser);
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // Handle student update from settings (e.g., Blueprint connection)
  const handleStudentUpdate = async () => {
    if (user) {
      const student = await verifyBootcampStudent(user.email);
      if (student) {
        setBootcampStudent(student);
      }
    }
  };

  // queryClient is retained here for future hook callers (e.g., invalidating queries)
  void queryClient;

  return {
    user,
    setUser,
    bootcampStudent,
    setBootcampStudent,
    showRegister,
    setShowRegister,
    handleLogin,
    handleRegister,
    handleLogout,
    handleStudentUpdate,
  };
}
