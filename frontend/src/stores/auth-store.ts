import type { User } from "../types";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "user";

export const authStore = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),

  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),

  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setAuth: (accessToken: string, refreshToken: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Refresh just the cached user snapshot (role, quota, etc. can change
  // server-side while a session is still active) without touching tokens.
  setUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};
