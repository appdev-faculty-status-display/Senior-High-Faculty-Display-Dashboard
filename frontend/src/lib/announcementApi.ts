// lib/api/announcementApi.ts

import type {
    Announcement,
    AnnouncementScope,
    CreateAnnouncementBody,
    ListAnnouncementsParams,
    ListAnnouncementsResult,
} from "@/types/announcement";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export type {
    Announcement,
    CreateAnnouncementBody,
    ListAnnouncementsParams,
    ListAnnouncementsResult,
};

type RawAnnouncement = {
    _id?: string;
    id: string;
    message: string;
    scope: AnnouncementScope;
    strand?: string | null;
    isActive: boolean;
    createdAt: string;
    expiresAt?: string | null;
};


// helper to normalize _id → id
function normalizeAnnouncement(raw: RawAnnouncement): Announcement {
    return {
        id: raw._id ?? raw.id,
        message: raw.message,
        scope: raw.scope,
        strand: raw.strand ?? null,
        isActive: raw.isActive,
        createdAt: raw.createdAt,
        expiresAt: raw.expiresAt ?? null,
    };
}


const BASE = (import.meta.env.VITE_API_URL ?? '') + "/api"; 

async function parseError(res: Response): Promise<never> {
    let message = `Request failed with status ${res.status}`;
    try {
        const body = await res.json();
        if (body?.message) message = body.message;
        else if (body?.error) message = body.error;
    } catch {
        // ignore
    }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
}

// GET /announcements
export async function fetchAnnouncements(
    params: ListAnnouncementsParams = {}
): Promise<ListAnnouncementsResult> {
    const qs = new URLSearchParams();

    if (params.isActive === true) qs.set("isActive", "true");
    if (params.isActive === false) qs.set("isActive", "false");
    if (params.scope) qs.set("scope", params.scope);
    if (params.strand) qs.set("strand", params.strand);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));

    const url = `${BASE}/announcements${qs.size ? `?${qs}` : ""}`;

    const res = await fetch(url);

    if (!res.ok) await parseError(res);
    const result = await res.json();
    return {
        data: result.data.map(normalizeAnnouncement),
        total: result.total,
        page: result.page,
    };
}

// POST /announcements
export async function postAnnouncement(
    body: CreateAnnouncementBody
): Promise<Announcement> {
    const res = await fetchWithAuth(`${BASE}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) await parseError(res);
    const raw = await res.json();
    return normalizeAnnouncement(raw);
}

// DELETE /announcements/:id
export async function deleteAnnouncement(
    id: string
): Promise<{ message: string; id: string }> {
    const res = await fetchWithAuth(`${BASE}/announcements/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) await parseError(res);
    return res.json();
}