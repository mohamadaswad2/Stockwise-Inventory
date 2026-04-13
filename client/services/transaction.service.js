import api from './api';

// Auto-detect user's timezone once — browser Intl API, no library needed
// Returns IANA string e.g. 'Asia/Kuala_Lumpur'
const getUserTz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const recordTransaction = (data) => api.post('/transactions', data);
export const getTransactions   = (params) => api.get('/transactions', { params });

// Process a refund for a previous sale transaction
export const refundTransaction = (data) => api.post('/transactions/refund', data);

// Always send tz with analytics calls
export const getSalesSummary = (period = '1m') =>
  api.get('/transactions/summary', { params: { period, tz: getUserTz() } });

export const getAnalytics = (period = 'today') =>
  api.get('/transactions/analytics', { params: { period, tz: getUserTz() } });

export const getItemAnalytics = (itemId, period) =>
  api.get(`/transactions/analytics/${itemId}`, { params: { period, tz: getUserTz() } });
