import api from './api';
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Public — no auth needed
export const getUpdates = (params) =>
  axios.get(`${BASE}/updates`, { params });

// Admin only — routes under /updates/admin
export const getAdminUpdates = (params) => api.get('/updates/admin', { params });
export const createUpdate    = (data)   => api.post('/updates/admin', data);
export const updateUpdate    = (id, d)  => api.put(`/updates/admin/${id}`, d);
export const deleteUpdate    = (id)     => api.delete(`/updates/admin/${id}`);
export const likeUpdate      = (id)     => api.post(`/updates/${id}/like`);
