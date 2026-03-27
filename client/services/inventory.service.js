/**
 * Inventory API calls — full CRUD + categories.
 */
import api from './api';

// Items
export const getItems    = (params) => api.get('/inventory', { params });
export const getItem     = (id)     => api.get(`/inventory/${id}`);
export const createItem  = (data)   => api.post('/inventory', data);
export const updateItem  = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteItem  = (id)     => api.delete(`/inventory/${id}`);

// Categories
export const getCategories    = ()       => api.get('/inventory/categories');
export const createCategory   = (data)   => api.post('/inventory/categories', data);
export const deleteCategory   = (id)     => api.delete(`/inventory/categories/${id}`);
