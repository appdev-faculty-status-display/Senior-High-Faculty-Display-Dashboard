import { apiRefresh } from '@/lib/authApi';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

let refreshInFlight: Promise<string | null> | null = null;

function clearAuthStorage() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}

async function refreshSession(): Promise<string | null> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;

    if (!refreshInFlight) {
        refreshInFlight = apiRefresh(refreshToken)
            .then((data) => {
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem(REFRESH_KEY, data.refreshToken);
                return data.token;
            })
            .catch(() => {
                clearAuthStorage();
                return null;
            })
            .finally(() => {
                refreshInFlight = null;
            });
    }

    return refreshInFlight;
}

function buildHeaders(initHeaders?: HeadersInit, token?: string): Headers {
    const headers = new Headers(initHeaders ?? {});

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
}

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = buildHeaders(init.headers, token ?? undefined);
    const response = await fetch(input, { ...init, headers });

    if (response.status !== 401) {
        return response;
    }

    const refreshedToken = await refreshSession();
    if (!refreshedToken) {
        return response;
    }

    const retryHeaders = buildHeaders(init.headers, refreshedToken);
    return fetch(input, { ...init, headers: retryHeaders });
}