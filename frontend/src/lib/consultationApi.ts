const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

export interface ApprovedConsultation {
    _id: string;
    studentName: string;
    studentId: string;
    studentEmail: string;
    strand: string;
    teacher: string;
    room: string;
    time: string;
    urgency: 'low' | 'medium' | 'high';
    status: 'approved' | 'pending' | 'rejected';
}

export interface ApprovedConsultationsResponse {
    data: ApprovedConsultation[];
    total: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
        const errorMsg = typeof data === 'object' && data !== null && 'error' in data
            ? data.error
            : JSON.stringify(data);
        throw new Error(`API Error (${res.status}): ${errorMsg}`);
    }
    return data as T;
}

export async function getApprovedConsultations(): Promise<ApprovedConsultationsResponse> {
    const url = `${BASE_URL}/requests/approved-consultations`;
    console.log('Fetching from:', url);

    try {
        const res = await fetch(url);

        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);

        return handleResponse<ApprovedConsultationsResponse>(res);
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}
