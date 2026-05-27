// hooks/useSchedules.ts

import { useState, useCallback, useEffect } from "react";
import type { FacultySchedule, ScheduleRowDto } from "@/types/schedule";
import { deriveDisplayFields } from "@/types/schedule";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

interface UseSchedulesReturn {
    schedules:      FacultySchedule[];
    setSchedules:   React.Dispatch<React.SetStateAction<FacultySchedule[]>>;
    isFetching:     boolean;
    fetchError:     string | null;
    fetchSchedules: () => Promise<void>;
}

export function useSchedules(): UseSchedulesReturn {
    const [schedules,  setSchedules]  = useState<FacultySchedule[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchSchedules = useCallback(async () => {
        setIsFetching(true);
        setFetchError(null);
        try {
            const res = await fetchWithAuth(`${BASE_URL}/schedule`);

            if (!res.ok) {
                setFetchError("Failed to load schedules.");
                return;
            }

            const raw: ScheduleRowDto[] = await res.json();
            setSchedules(raw.map((row, index) => deriveDisplayFields(row, index)));
        } catch {
            setFetchError("Network error. Could not load schedules.");
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    return { schedules, setSchedules, isFetching, fetchError, fetchSchedules };
}