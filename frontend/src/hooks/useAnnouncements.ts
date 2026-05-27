// consumers:

// 1. footer snippet - useAnnouncements()
// 2. add announcement table - useAnnouncements()
// 3. add form - call the returned `add` action directly

// hooks/useAnnouncements.ts

import { useState, useEffect, useCallback } from "react";
import {
    fetchAnnouncements,
    postAnnouncement,
    deleteAnnouncement,
} from "@/lib/announcementApi";
import type {
    Announcement,
    CreateAnnouncementBody,
    ListAnnouncementsParams,
} from "@/types/announcement";

export interface UseAnnouncementsOptions extends ListAnnouncementsParams {
    enabled?: boolean;
}

export interface UseAnnouncementsReturn {
    announcements: Announcement[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    error: string | null;
    add:     (body: CreateAnnouncementBody) => Promise<void>;
    remove:  (id: string) => Promise<void>;
    setPage: (page: number) => void;
    refresh: () => void;
}

export function useAnnouncements(
    options: UseAnnouncementsOptions = {}
): UseAnnouncementsReturn {
    const {
        enabled = true,
        scope,
        strand,
        isActive,
        pageSize = 20,
        page: initialPage = 1,
    } = options;

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [total, setTotal]     = useState(0);
    const [page, setPage]       = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const [refreshTick, setRefreshTick] = useState(0);
    const refresh = useCallback(() => setRefreshTick((n) => n + 1), []);

    // fetch
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        const timer = setTimeout(() => {
            if (cancelled) return;
            setLoading(true);
            setError(null);
        }, 0);

        fetchAnnouncements({ scope, strand, isActive, page, pageSize })
            .then((result) => {
                if (cancelled) return;
                setAnnouncements(result.data);
                setTotal(result.total);
                setPage(result.page);
            })
            .catch((err: Error) => {
                if (cancelled) return;
                setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { 
            cancelled = true;
            clearTimeout(timer);
        };
    }, [enabled, scope, strand, isActive, page, pageSize, refreshTick]);

    // add
    const add = useCallback(async (body: CreateAnnouncementBody) => {
        setError(null);
        try {
            const created = await postAnnouncement(body);
            setAnnouncements((prev) => [created, ...prev]);
            setTotal((n) => n + 1);
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, []);

    // remove 
    const remove = useCallback(async (id: string) => {
        setError(null);
        try {
            await deleteAnnouncement(id);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
            setTotal((n) => Math.max(0, n - 1));
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, []);

    return {
        announcements,
        total,
        page,
        pageSize,
        loading,
        error,
        add,
        remove,
        setPage,
        refresh,
    };
}