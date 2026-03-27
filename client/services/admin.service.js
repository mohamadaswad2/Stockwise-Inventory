import api from './api';

export const getAdminStats = ()       => api.get('/admin/stats');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const toggleUserLock = (id)   => api.patch(`/admin/users/${id}/toggle-lock`);
