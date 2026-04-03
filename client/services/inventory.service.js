import api from './api';

export const getItems       = (params)        => api.get('/inventory', { params });
export const getItem        = (id)             => api.get(`/inventory/${id}`);
export const createItem     = (data)           => api.post('/inventory', data);
export const updateItem     = (id, data)       => api.put(`/inventory/${id}`, data);
export const deleteItem     = (id)             => api.delete(`/inventory/${id}`);
export const quickSell      = (id, quantity)   => api.post(`/inventory/${id}/quick-sell`, { quantity });
export const restockItem    = (id, data)       => api.post(`/inventory/${id}/restock`, data);
export const getCategories  = ()               => api.get('/inventory/categories');
export const exportCSV      = ()               => api.get('/inventory/export/csv', { responseType: 'blob' });
export const getExportQuota = ()               => api.get('/inventory/export/quota');

// Alias for consistency with QuickSaleModal
export const getInventory    = getItems;
