/**
 * useInventory — data-fetching hook for inventory list with pagination + filters.
 */
import { useState, useEffect, useCallback } from 'react';
import * as inventoryService from '../services/inventory.service';
import toast from 'react-hot-toast';

export function useInventory(initialFilters = {}) {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 20, search: '', ...initialFilters });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getItems(filters);
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const deleteItem = async (id) => {
    await inventoryService.deleteItem(id);
    toast.success('Item deleted.');
    fetch();
  };

  return { items, total, loading, filters, setFilters, refetch: fetch, deleteItem };
}
