import { useState, useEffect, useCallback } from 'react';
import * as inventoryService from '../services/inventory.service';
import toast from 'react-hot-toast';

// Retry configuration for handling cold-start delays
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500; // 1.5s between retries
const INITIAL_DELAY = 300; // Small delay to ensure auth is ready

export function useInventory(initialFilters = {}) {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filters, setFilters] = useState({
    page: 1, limit: 20, search: '', ...initialFilters
  });

  const fetch = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build clean params — remove undefined/empty values
      const params = {};
      if (filters.page)        params.page   = filters.page;
      if (filters.limit)       params.limit  = filters.limit;
      if (filters.search)      params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.low_stock)   params.low_stock   = true;

      const res = await inventoryService.getItems(params);
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      const isNetworkError = !err.response && err.message?.includes('Network');
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const isServerError = err.response?.status >= 500;
      
      // Retry on network/timeout/server errors (likely cold start)
      const shouldRetry = (isNetworkError || isTimeout || isServerError) && retryCount < MAX_RETRIES;
      
      if (shouldRetry) {
        console.log(`[useInventory] Retry ${retryCount + 1}/${MAX_RETRIES} after ${RETRY_DELAY}ms...`);
        setTimeout(() => fetch(retryCount + 1), RETRY_DELAY);
        return; // Don't set loading false yet, we're retrying
      }
      
      // Final failure - show error
      setError(err.response?.data?.message || 'Failed to load inventory.');
      // Only show toast on final retry or client errors (4xx)
      if (!shouldRetry && retryCount >= MAX_RETRIES) {
        toast.error(err.response?.data?.message || 'Failed to load inventory. Please refresh.');
      }
    } finally {
      // Only set loading false if we're not retrying
      if (!(error && retryCount < MAX_RETRIES)) {
        setLoading(false);
      }
    }
  }, [filters]);

  // Delayed initial fetch to ensure auth token is ready
  useEffect(() => { 
    const timer = setTimeout(() => {
      fetch();
    }, INITIAL_DELAY);
    return () => clearTimeout(timer);
  }, [fetch]);

  const deleteItem = async (id) => {
    await inventoryService.deleteItem(id);
    toast.success('Item deleted.');
    fetch();
  };

  return { items, total, loading, error, filters, setFilters, refetch: fetch, deleteItem };
}
