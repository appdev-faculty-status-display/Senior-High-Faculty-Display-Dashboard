import { fetchWithAuth } from './fetchWithAuth';
import type { RecencyLogEntry } from "@/types/adminDashboard.types";
import type { Status } from "@/types/schedule";

export interface FacultyActivityResponse {
  statusDistribution?: Record<string, number>;
  recencyLog?: Array<Omit<RecencyLogEntry, "currentStatus"> & { currentStatus: Status }>;
}

export interface ConsultationResponse {
  consultationEfficiency?: {
    quickConsultations: number;
    consultationRoom: number;
  };
}

type CacheEntry = { expiresAt: number; data: unknown };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30 * 1000; // 30s cache

function buildKey(path: string, params?: Record<string,string|number|undefined>) {
  const qs = params
    ? Object.entries(params)
        .filter(([,v]) => v !== undefined && v !== null && v !== '')
        .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return qs ? `${path}?${qs}` : path;
}

async function cachedGet<T>(path: string, params?: Record<string,string|number|undefined>, forceRefresh = false): Promise<T> {
  const key = buildKey(path, params);
  const now = Date.now();
  if (!forceRefresh) {
    const e = cache.get(key);
    if (e && e.expiresAt > now) return e.data as T;
  }

  const qs = params
    ? Object.entries(params)
        .filter(([,v]) => v !== undefined && v !== null && v !== '')
        .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const url = `/api/analytics/${path}${qs ? `?${qs}` : ''}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(key, { expiresAt: now + TTL_MS, data });
  return data;
}

export async function getFacultyActivity(opts?: { from?: string; to?: string; strand?: string }): Promise<FacultyActivityResponse> {
  return cachedGet<FacultyActivityResponse>('faculty-activity', opts);
}

export async function getConsultation(opts?: { from?: string; to?: string; faculty?: string }): Promise<ConsultationResponse> {
  return cachedGet<ConsultationResponse>('consultation', opts);
}

export function clearAnalyticsCache() {
  cache.clear();
}

export function invalidateKey(path: string, params?: Record<string,string|number|undefined>) {
  const key = buildKey(path, params);
  cache.delete(key);
}
