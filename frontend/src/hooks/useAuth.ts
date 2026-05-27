import { useState, useCallback } from 'react';
import { apiLogin, apiLogout, apiRefresh } from '@/lib/authApi';
import type { LoginPayload, ApiError, AuthTokens } from '@/lib/authApi';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<AuthTokens['user'] | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  
  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(payload);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      const apiErr = err as ApiError;
      // Map backend error codes to friendly messages
      const message =
        apiErr.code === 'MISSING_CREDENTIALS'
          ? 'Please enter your email and password.'
          : apiErr.code === 'INVALID_LOGIN'
          ? 'Invalid email or password.'
          : apiErr.message ?? 'Something went wrong. Please try again.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY) ?? '';
    const refreshToken = localStorage.getItem(REFRESH_KEY) ?? '';
    try {
      await apiLogout(token, refreshToken);
    } finally {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  }, []);

  /**
   * Call this from an Axios/fetch interceptor when you get a 401.
   * Returns the new access token on success, or null if the session has expired.
   */
  const refresh = useCallback(async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;
    try {
      const data = await apiRefresh(refreshToken);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      return data.token;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      return null;
    }
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return { login, logout, refresh, getToken, loading, error, setError, user };
}