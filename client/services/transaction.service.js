import api from './api';

export const recordTransaction = (data)          => api.post('/transactions', data);
export const getTransactions   = (params)         => api.get('/transactions', { params });
export const getSalesSummary   = ()               => api.get('/transactions/analytics?period=1m');
export const getAnalytics      = (period = '1m')  => api.get(`/transactions/analytics?period=${period}`);
export const getItemAnalytics  = (itemId, period) => api.get(`/transactions/analytics/${itemId}?period=${period}`);
