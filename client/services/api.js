/**
 * Axios instance — pre-configured with base URL and auth interceptors.
 *
 * FIX: 401 interceptor must NOT fire during/after login flow.
 * Problem was: after login sets token, a stale/concurrent 401 from
 * a different request would clear the freshly-set token and redirect.
 *
 * Solution: track whether a login is in-progress, skip interceptor then.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Flag: true while login request is in-flight
// Prevents 401 interceptor from clearing the token during login
let isLoggingIn = false;
export const setLoggingIn = (v) => { isLoggingIn = v; };

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url    = err.config?.url || '';

    // Skip 401 handling for:
    // 1. Login request itself (wrong password — let the form handle it)
    // 2. While a login is in-progress (prevent race condition)
    // 3. Auth endpoints generally (register, verify, forgot-password)
    const isAuthEndpoint = url.includes('/auth/');
    if (status === 401 && !isAuthEndpoint && !isLoggingIn) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on an auth page
        const path = window.location.pathname;
        if (!path.startsWith('/auth/')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
