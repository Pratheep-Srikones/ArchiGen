import { create } from "zustand";

type User = {
  id: string;
  username: string;
  picture?: string;
  fullName?: string;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  setAuth: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  setAuth: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      loading: false,
    }),

  setLoading: (loading) => set({ loading }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
    }),
}));
