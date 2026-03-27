import api from './api';

export const recordTransaction  = (data)   => api.post('/transactions', data);
export const getTransactions    = (params) => api.get('/transactions', { params });
export const getSalesSummary    = ()       => api.get('/transactions/summary');
