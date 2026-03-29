import api from './api';

// Items
export const getItems   = (params) => api.get('/inventory', { params });
export const getItem    = (id)      => api.get(`/inventory/${id}`);
export const createItem = (data)    => api.post('/inventory', data);
export const updateItem = (id, data)=> api.put(`/inventory/${id}`, data);
export const deleteItem = (id)      => api.delete(`/inventory/${id}`);

// Quick sell — simplified one-click sale
export const quickSell  = (id, quantity) => api.post(`/inventory/${id}/quick-sell`, { quantity });

// Categories
export const getCategories  = ()      => api.get('/inventory/categories');
export const createCategory = (data)  => api.post('/inventory/categories', data);
export const deleteCategory = (id)    => api.delete(`/inventory/categories/${id}`);

// CSV Export — returns blob
export const exportCSV = async () => {
  const res = await api.get('/inventory/export/csv', { responseType: 'blob' });
  return res;
};
