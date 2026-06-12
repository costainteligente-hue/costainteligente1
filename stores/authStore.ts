import { create } from 'zustand';
import { UserRole } from '@/types';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  setSession: (session: Session | null, role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  isLoading: true,
  setSession: (session, role) =>
    set({ session, user: session?.user ?? null, role, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, session: null, role: null, isLoading: true }),
}));
