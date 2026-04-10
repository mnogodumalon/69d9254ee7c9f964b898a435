import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BenutzerRollen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [benutzerRollen, setBenutzerRollen] = useState<BenutzerRollen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [benutzerRollenData] = await Promise.all([
        LivingAppsService.getBenutzerRollen(),
      ]);
      setBenutzerRollen(benutzerRollenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [benutzerRollenData] = await Promise.all([
          LivingAppsService.getBenutzerRollen(),
        ]);
        setBenutzerRollen(benutzerRollenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  return { benutzerRollen, setBenutzerRollen, loading, error, fetchAll };
}