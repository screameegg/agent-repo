import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  avatar?: string;
  role?: string;
}

interface UserState {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'lobster-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
