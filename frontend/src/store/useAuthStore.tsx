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
  token: string | null,

  setAuth: (user: User | null) => void;
  setAuthSession: (user: User| null, token: string| null) => void;
  setToken: (token: string| null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  token: null,

  setAuth: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      loading: false,
    }),

    setAuthSession: (user, token) =>
    set({
      user,
      isAuthenticated: !!user,
      loading: false,
      token,
    }),

  setLoading: (loading) => set({ loading }),

  setToken: (token) => set({ token }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      token: "",
    }),
}));
