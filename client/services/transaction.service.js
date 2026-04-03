import api from './api';

// Record a transaction (sale, restock, usage, adjustment)
export const recordTransaction = (data) => api.post('/transactions', data);

// List transactions with filters
export const getTransactions = (params) => api.get('/transactions', { params });

// Summary — used by Sales page
// Returns: { sales, topItems, trend }
export const getSalesSummary = (period = '1m') =>
  api.get('/transactions/summary', { params: { period } });

// Analytics — used by Analytics page
// Returns: { summary, topItems, trend }
export const getAnalytics = (period = '1m') =>
  api.get('/transactions/analytics', { params: { period } });
