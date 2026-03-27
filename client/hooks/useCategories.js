/**
 * useCategories — fetch global preset categories dari server.
 * Categories adalah sama untuk semua users — diset oleh admin.
 */
import { useState, useEffect } from 'react';
import { getCategories } from '../services/inventory.service';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.data.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
