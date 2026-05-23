// types/announcement.ts

export type AnnouncementScope = "all" | "strand";

export interface Announcement {
    id: string;               // MongoDB _id — string, not number
    message: string;          // no title in the backend
    scope: AnnouncementScope;
    strand: string | null;
    isActive: boolean;
    createdAt: string;        // ISO string
    expiresAt: string | null; // ISO string or null
}

export interface CreateAnnouncementBody {
    message: string;
    scope: AnnouncementScope;
    strand?: string;          // required only when scope === "strand"
    expiresAt?: string;       // optional ISO string
}

export interface ListAnnouncementsParams {
    scope?: AnnouncementScope;
    strand?: string;
    page?: number;
    pageSize?: number;
    /** Only principal can pass false */
    isActive?: true;
}

export interface ListAnnouncementsResult {
    data: Announcement[];
    total: number;
    page: number;
}