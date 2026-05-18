const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

export type FacultyStatus =
    | 'available'
    | 'in_class'
    | 'in_meeting'
    | 'on_break'
    | 'off_campus'
    | 'do_not_disturb'
    | 'in_consultation';

export type FacultyRole = 'faculty' | 'strand_head' | 'principal';

export interface ConsultationHour {
    day: string;
    startTime: string;
    endTime: string;
}

export interface ScheduleEntry {
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    room: string;
}

export interface FacultyCard {
    id: string;
    name: string;
    strand: string;
    role: FacultyRole;
    currentStatus: FacultyStatus;
    currentRoom: string | null;
    subjects: string[];
    consultationHours: ConsultationHour[];
    schedule: ScheduleEntry[];
}

export interface FacultyListResponse {
    data: FacultyCard[];
    total: number;
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

export interface FacultyQueryParams {
    strand?: string;
    status?: string;
}

export async function apiFetchFaculty(
    params: FacultyQueryParams = {},
): Promise<FacultyListResponse> {
    const query = new URLSearchParams();
    if (params.strand !== undefined && params.strand !== '')
        query.set('strand', params.strand);
    if (params.status !== undefined && params.status !== '')
        query.set('status', params.status);

    const qs = query.size > 0 ? `?${query.toString()}` : '';

    const res = await fetch(`${BASE_URL}/faculty${qs}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<FacultyListResponse>(res);
}