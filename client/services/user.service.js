import api from './api';

export const getMe              = ()     => api.get('/users/me');
export const updateMe           = (data) => api.patch('/users/me', data);
export const sendLowStockAlert  = ()     => api.post('/users/alert/low-stock');
