import api from './api';

export const getItems      = (params) => api.get('/inventory', { params });
export const getItem       = (id)     => api.get(`/inventory/${id}`);
export const createItem    = (data)   => api.post('/inventory', data);
export const updateItem    = (id, d)  => api.put(`/inventory/${id}`, d);
export const deleteItem    = (id)     => api.delete(`/inventory/${id}`);
export const exportCSV     = ()       => api.get('/inventory/export/csv', { responseType: 'text' });
export const quickSell     = (id, d)  => api.post(`/inventory/${id}/quick-sell`, d);
export const restock       = (id, d)  => api.post(`/inventory/${id}/restock`, d);
export const getCategories = ()       => api.get('/inventory/categories');
export const createCategory= (data)   => api.post('/inventory/categories', data);
export const deleteCategory= (id)     => api.delete(`/inventory/categories/${id}`);
export const getStats      = ()       => api.get('/dashboard');
