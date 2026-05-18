import { useState, useCallback } from 'react';
import { apiFetchRooms } from '@/lib/consultationApi';
import type { ConsultationRoom, ApiError } from '@/lib/consultationApi';

interface UseConsultationRoomsReturn {
    rooms: ConsultationRoom[];
    available: number;
    loading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    fetchRooms: () => Promise<void>;
}

export function useConsultationRooms(): UseConsultationRoomsReturn {
    const [rooms, setRooms] = useState<ConsultationRoom[]>([]);
    const [available, setAvailable] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRooms = useCallback(async () => {
        setLoading((prev) => (rooms.length === 0 ? true : prev));
        setError(null);
        try {
            const data = await apiFetchRooms();
            setRooms(data.data);
            setAvailable(data.available);
        } catch (err) {
            const apiErr = err as ApiError;
            const message =
                apiErr.code === 'RATE_LIMITED'
                    ? 'Too many requests. The board will retry shortly.'
                    : apiErr.code === 'INTERNAL_ERROR'
                        ? 'Server error. Displaying last known data.'
                        : apiErr.error ?? 'Could not reach the server. Displaying last known data.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [rooms.length]);

    return { rooms, available, loading, error, setError, fetchRooms };
}