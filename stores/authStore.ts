/**
 * useAuthStore — Costa Inteligente
 * Estado de autenticación local con SQLite.
 * @module stores/authStore
 */

import { create } from 'zustand';
import type { UserRole } from '@/types';
import type { AuthSession } from '@/lib/services/auth.service';

export interface LocalUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}

interface AuthState {
  /** Authenticated user */
  user: LocalUser | null;
  /** Active session */
  session: AuthSession | null;
  /** User role — kept at top level for fast access */
  role: UserRole | null;
  /** True while checking persisted session on app start */
  isLoading: boolean;

  // ─── Actions ─────────────────────────────────────────────
  setSession: (session: AuthSession | null, role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  isLoading: true,

  setSession: (session, role) =>
    set({
      session,
      user: session
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            fullName: session.user.fullName,
          }
        : null,
      role,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () => set({ user: null, session: null, role: null, isLoading: false }),
}));
