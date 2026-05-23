// lib/api/announcementApi.ts

import type {
    Announcement,
    CreateAnnouncementBody,
    ListAnnouncementsParams,
    ListAnnouncementsResult,
} from "@/types/announcement";

export type {
    Announcement,
    CreateAnnouncementBody,
    ListAnnouncementsParams,
    ListAnnouncementsResult,
};

// helper to normalize _id → id
function normalizeAnnouncement(raw: any): Announcement {
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

function authHeaders(token?: string): HeadersInit {
    return token
        ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : { "Content-Type": "application/json" };
}

async function parseError(res: Response): Promise<never> {
    let message = `Request failed with status ${res.status}`;
    try {
        const body = await res.json();
        if (body?.error) message = body.error;
    } catch {
        // ignore
    }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
}

// GET /announcements
export async function fetchAnnouncements(
    params: ListAnnouncementsParams = {},
    token?: string
): Promise<ListAnnouncementsResult> {
    const qs = new URLSearchParams();

    if (params.isActive === true)  qs.set("isActive", "true");   
    if (params.isActive === false) qs.set("isActive", "false");
    if (params.scope)              qs.set("scope",    params.scope);
    if (params.strand)             qs.set("strand",   params.strand);
    if (params.page)               qs.set("page",     String(params.page));
    if (params.pageSize)           qs.set("pageSize", String(params.pageSize));
    if (params.isActive === false) qs.set("isActive", "false");

    const url = `${BASE}/announcements${qs.size ? `?${qs}` : ""}`;

    const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

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
    body: CreateAnnouncementBody,
    token: string
): Promise<Announcement> {
    const res = await fetch(`${BASE}/announcements`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(body),
    });

    if (!res.ok) await parseError(res);
    const raw = await res.json();
    return normalizeAnnouncement(raw);
}

// DELETE /announcements/:id
export async function deleteAnnouncement(
    id: string,
    token: string
): Promise<{ message: string; id: string }> {
    const res = await fetch(`${BASE}/announcements/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });

    if (!res.ok) await parseError(res);
    return res.json();
}