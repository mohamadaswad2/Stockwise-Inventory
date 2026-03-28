/**
 * AuthContext — global auth state.
 * 
 * FIXED:
 * - register() no longer tries to extract token (register doesn't return token)
 * - login() properly propagates errors so callers can handle them
 * - Stores pending verification email for OTP redirect
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import * as authService from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user,             setUser]             = useState(null);
  const [token,            setToken]            = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState(null); // for OTP redirect

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser  = localStorage.getItem('user');
      const storedPending = localStorage.getItem('pendingVerifyEmail');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      if (storedPending) setPendingVerifyEmail(storedPending);
    } catch (_) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login — throws on error so callers can catch and show specific messages
  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    const { user: u, token: t } = res.data.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.removeItem('pendingVerifyEmail');
    setToken(t);
    setUser(u);
    setPendingVerifyEmail(null);
    return u;
  }, []);

  // Register — does NOT return a token, just confirms registration started
  // User must verify email before they can login
  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    // Store email so OTP screen knows which email to show
    localStorage.setItem('pendingVerifyEmail', data.email);
    setPendingVerifyEmail(data.email);
    return res.data.data; // { user, requiresVerification: true }
  }, []);

  // Called after OTP verified — receives token from verifyEmail response
  const completeVerification = useCallback((u, t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.removeItem('pendingVerifyEmail');
    setToken(t);
    setUser(u);
    setPendingVerifyEmail(null);
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingVerifyEmail');
    setToken(null);
    setUser(null);
    setPendingVerifyEmail(null);
    router.push('/auth/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token,
      pendingVerifyEmail,
      login, register, logout, completeVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
