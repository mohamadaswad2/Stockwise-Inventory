import api from './api';
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Public — no auth needed
export const getUpdates = (params) =>
  axios.get(`${BASE}/updates`, { params });

// Admin only
export const createUpdate = (data) => api.post('/admin/updates', data);
export const deleteUpdate = (id)   => api.delete(`/admin/updates/${id}`);
