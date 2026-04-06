/**
 * Dashboard API calls.
 */
import api from './api';

export const getDashboardStats = (period = '30d') => api.get('/dashboard/stats', { params: { period } });
