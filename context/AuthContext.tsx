import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GCMember, AppMode, AuthState } from '../types/gc-types';
import { User } from '../types';
import { verifyGCMember } from '../services/supabase';
import { verifyUser } from '../services/airtable';

interface AuthContextType extends AuthState {
  loginGC: (email: string) => Promise<boolean>;
  loginBootcamp: (email: string) => Promise<boolean>;
  logout: () => void;
  setMode: (mode: AppMode) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GC_MEMBER_KEY = 'gc_member';
const BOOTCAMP_USER_KEY = 'lms_user_obj';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    mode: null,
    gcMember: null,
    error: null,
  });

  // Separate bootcamp user state (kept for bootcamp compatibility)
  const [_bootcampUser, setBootcampUser] = useState<User | null>(null);

  // Load saved auth state on mount
  useEffect(() => {
    const loadSavedAuth = () => {
      try {
        // Check for GC member
        const savedGCMember = localStorage.getItem(GC_MEMBER_KEY);
        if (savedGCMember) {
          const member = JSON.parse(savedGCMember) as GCMember;
          setState({
            isAuthenticated: true,
            isLoading: false,
            mode: 'gc',
            gcMember: member,
            error: null,
          });
          return;
        }

        // Check for bootcamp user
        const savedBootcampUser = localStorage.getItem(BOOTCAMP_USER_KEY);
        if (savedBootcampUser) {
          const user = JSON.parse(savedBootcampUser) as User;
          setBootcampUser(user);
          setState({
            isAuthenticated: true,
            isLoading: false,
            mode: 'bootcamp',
            gcMember: null,
            error: null,
          });
          return;
        }

        // No saved auth
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Failed to load saved auth:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadSavedAuth();
  }, []);

  const loginGC = useCallback(async (email: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const member = await verifyGCMember(email);

      if (member) {
        localStorage.setItem(GC_MEMBER_KEY, JSON.stringify(member));
        setState({
          isAuthenticated: true,
          isLoading: false,
          mode: 'gc',
          gcMember: member,
          error: null,
        });
        return true;
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          mode: null,
          gcMember: null,
          error: 'Email not found. Please check your email or contact support.',
        });
        return false;
      }
    } catch (error) {
      console.error('GC login failed:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        mode: null,
        gcMember: null,
        error: 'Login failed. Please try again.',
      });
      return false;
    }
  }, []);

  const loginBootcamp = useCallback(async (email: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = await verifyUser(email);

      if (user) {
        localStorage.setItem(BOOTCAMP_USER_KEY, JSON.stringify(user));
        setBootcampUser(user);
        setState({
          isAuthenticated: true,
          isLoading: false,
          mode: 'bootcamp',
          gcMember: null,
          error: null,
        });
        return true;
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          mode: null,
          gcMember: null,
          error: 'Email not found in bootcamp roster.',
        });
        return false;
      }
    } catch (error) {
      console.error('Bootcamp login failed:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        mode: null,
        gcMember: null,
        error: 'Login failed. Please try again.',
      });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(GC_MEMBER_KEY);
    localStorage.removeItem(BOOTCAMP_USER_KEY);
    setBootcampUser(null);
    setState({
      isAuthenticated: false,
      isLoading: false,
      mode: null,
      gcMember: null,
      error: null,
    });
  }, []);

  const setMode = useCallback((mode: AppMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const value: AuthContextType = {
    ...state,
    loginGC,
    loginBootcamp,
    logout,
    setMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export bootcamp user hook for bootcamp compatibility
export function useBootcampUser(): User | null {
  const savedUser = localStorage.getItem(BOOTCAMP_USER_KEY);
  if (savedUser) {
    try {
      return JSON.parse(savedUser) as User;
    } catch {
      return null;
    }
  }
  return null;
}
