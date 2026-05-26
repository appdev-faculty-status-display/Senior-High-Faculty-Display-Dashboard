const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

export interface ResourceCommunicationFilters {
  from?: string;
  to?: string;
  strand?: string;
}

export interface ResourceCommunicationAnalyticsResponse {
  announcementReach: {
    labels: string[];
    strandSpecific: number[];
    schoolWide: number[];
  };
  roomOccupancy: {
    rooms: Array<{ room: string; used: number; available: number }>;
  };
  generatedAt: string;
}

function buildQuery(params: ResourceCommunicationFilters): string {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.strand) qs.set('strand', params.strand);
  const query = qs.toString();
  return query ? `?${query}` : '';
}

export async function fetchResourceCommunicationAnalytics(
  params: ResourceCommunicationFilters
): Promise<ResourceCommunicationAnalyticsResponse> {
  const res = await fetch(`${BASE_URL}/analytics/resource-communication${buildQuery(params)}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}
