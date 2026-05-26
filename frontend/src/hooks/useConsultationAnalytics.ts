import { useEffect, useState } from 'react';
import { fetchConsultationAnalytics } from '@/lib/consultationAnalyticsApi';
import type { ConsultationAnalyticsFilters, ConsultationAnalyticsResponse } from '@/lib/consultationAnalyticsApi';

interface UseConsultationAnalyticsOptions extends ConsultationAnalyticsFilters {
  pollIntervalMs?: number;
  enabled?: boolean;
}

export function useConsultationAnalytics({
  from,
  to,
  faculty,
  pollIntervalMs = 5000,
  enabled = true,
}: UseConsultationAnalyticsOptions) {
  const [data, setData] = useState<ConsultationAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchConsultationAnalytics({ from, to, faculty });
        if (!isMounted) return;
        setData(response);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, pollIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [from, to, faculty, pollIntervalMs, enabled]);

  return { data, loading, error };
}
