const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

export interface RoomOccupant {
    id: string;
    name: string;
}

export interface ConsultationRoom {
    id: string;
    roomCode: string;
    location: string;
    capacity: number;
    isActive: boolean;
    currentOccupant: RoomOccupant | null;
    occupiedUntil: string | null;
}

export interface RoomListResponse {
    data: ConsultationRoom[];
    total: number;
    available: number;
}

export interface ApiError {
    error: string;
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

export async function apiFetchRooms(): Promise<RoomListResponse> {
    const res = await fetch(`${BASE_URL}/consultRooms`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<RoomListResponse>(res);
}