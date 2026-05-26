import { useEffect, useState } from 'react';
import { fetchResourceCommunicationAnalytics } from '@/lib/resourceCommunicationAnalyticsApi';
import type { ResourceCommunicationAnalyticsResponse, ResourceCommunicationFilters } from '@/lib/resourceCommunicationAnalyticsApi';

interface UseResourceCommunicationAnalyticsOptions extends ResourceCommunicationFilters {
  pollIntervalMs?: number;
  enabled?: boolean;
}

export function useResourceCommunicationAnalytics({
  from,
  to,
  strand,
  pollIntervalMs = 5000,
  enabled = true,
}: UseResourceCommunicationAnalyticsOptions) {
  const [data, setData] = useState<ResourceCommunicationAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchResourceCommunicationAnalytics({ from, to, strand });
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
  }, [from, to, strand, pollIntervalMs, enabled]);

  return { data, loading, error };
}
