/**
 * useDashboard — fetches aggregated stats for the dashboard page.
 */
import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboard.service';
import toast from 'react-hot-toast';

export function useDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
