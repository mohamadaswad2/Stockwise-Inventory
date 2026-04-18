import { useState, useEffect } from 'react';
import { getStats } from '../services/inventory.service';

export function useDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getStats();
        if (mounted) setStats(res.data.data);
      } catch {
        // stats stays null — dashboard shows empty state
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return { stats, loading };
}
