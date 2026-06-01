import { fetchWithAuth } from './fetchWithAuth';

type CacheEntry = { expiresAt: number; data: any };
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

async function cachedGet(path: string, params?: Record<string,string|number|undefined>, forceRefresh = false) {
  const key = buildKey(path, params);
  const now = Date.now();
  if (!forceRefresh) {
    const e = cache.get(key);
    if (e && e.expiresAt > now) return e.data;
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
  const data = await res.json();
  cache.set(key, { expiresAt: now + TTL_MS, data });
  return data;
}

export async function getFacultyActivity(opts?: { from?: string; to?: string; strand?: string }) {
  return cachedGet('faculty-activity', opts);
}

export async function getConsultation(opts?: { from?: string; to?: string; faculty?: string }) {
  return cachedGet('consultation', opts);
}

export function clearAnalyticsCache() {
  cache.clear();
}

export function invalidateKey(path: string, params?: Record<string,string|number|undefined>) {
  const key = buildKey(path, params);
  cache.delete(key);
}
