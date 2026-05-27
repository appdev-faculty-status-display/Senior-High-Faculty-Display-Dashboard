const BASE_URL = (import.meta.env.VITE_API_URL || 'https://facultyboard-cqdzg5a8dwccegby.japaneast-01.azurewebsites.net') + '/api';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthTokens {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        role: string;
        strand: string;
    };
}

export interface RefreshedTokens {
    token: string;
    refreshToken: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, unknown>;
}

async function handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
        throw data as ApiError;
    }
    return data as T;
}

export async function apiLogin(payload: LoginPayload): Promise<AuthTokens> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthTokens>(res);
}

export async function apiRefresh(refreshToken: string): Promise<RefreshedTokens> {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });
    return handleResponse<RefreshedTokens>(res);
}
 
export async function apiLogout(token: string, refreshToken: string): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
}
