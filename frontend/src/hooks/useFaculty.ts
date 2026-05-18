import { useState, useCallback } from 'react';
import { apiFetchFaculty } from '@/lib/facultyApi';
import type { FacultyCard, FacultyQueryParams, ApiError } from '@/lib/facultyApi';

interface UseFacultyOptions {
    pollInterval?: number;
}

interface UseFacultyReturn {
    faculty: FacultyCard[];
    loading: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    fetchFaculty: (params?: FacultyQueryParams) => Promise<void>;
}

export function useFaculty({ pollInterval: _pollInterval = 5_000 }: UseFacultyOptions = {}): UseFacultyReturn {
    const [faculty, setFaculty] = useState<FacultyCard[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFaculty = useCallback(async (params: FacultyQueryParams = {}) => {
        setLoading((prev) => (faculty.length === 0 ? true : prev));
        setError(null);
        try {
            const data = await apiFetchFaculty(params);
            setFaculty(data.data);
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
    }, [faculty.length]);

    return { faculty, loading, error, setError, fetchFaculty };
}