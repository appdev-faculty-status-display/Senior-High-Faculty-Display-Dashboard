// types/schedule.ts

// ── Primitive union types ─────────────────────────────────────────────────────

export type Strand =
    | "STEM"
    | "ABM"
    | "HUMSS";

export type Day =
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday";

// Status is a frontend-only display concept — it is never stored in the DB.
// It lives on FacultySchedule for UI rendering (StatusBadge) only.
export type Status =
    | "AVAILABLE"
    | "IN CLASS"
    | "OFF CAMPUS"
    | "DO NOT DISTURB"
    | "IN MEETING"
    | "ON BREAK";

// ── Backend sub-document (faculty.schedule[]) ─────────────────────────────────
// Mirrors the shape persisted inside the Faculty MongoDB document.
// startTime and endTime are HH:MM strings in Philippine Standard Time (UTC+8).

export interface ScheduleEntry {
    _id: string;        // MongoDB ObjectId string of the sub-document
    day: Day;
    startTime: string;  // "HH:MM" PH local time, 24-hour — e.g. "07:30"
    endTime: string;    // "HH:MM" PH local time, 24-hour — e.g. "09:00"
    subject: string;
    room: string;
}

// ── Frontend display type (one row in the schedule table) ─────────────────────
// This is what the table, EditScheduleModal, and filters operate on.
// Fields marked "derived" are computed client-side and never sent to the API.

export interface FacultySchedule {
    // Identity
    id: number;             // temporary client-side row key used by the table and
                            // EditScheduleModal's onDelete(id). Replace with _id
                            // once the list endpoint returns real MongoDB sub-doc ids.
    mongoId: string;        // Faculty document _id (ObjectId string)
    facultyId: string;      // business key — used in POST /api/schedules/:facultyId

    // Faculty-level fields (from the Faculty document, not the sub-doc)
    name: string;           // faculty member's display name
    strand: Strand;         // faculty's strand — not editable per schedule entry

    // Schedule entry fields (map 1-to-1 with ScheduleEntry, minus _id)
    day: Day;
    startTime: string;      // "HH:MM" PH local time — source of truth for time
    endTime: string;        // "HH:MM" PH local time — source of truth for time
    subject: string;
    room: string;

    // Frontend-only display fields — never sent to the API
    time: string;           // derived: formatPHTime(startTime) + " – " + formatPHTime(endTime)
                            // used in the table's Time column and EditScheduleModal's time input
    status: Status;         // not persisted in DB; UI display state only
    avatarInitials: string; // derived from name
    avatarColor: string;    // derived from name
}

// ── API response shapes ───────────────────────────────────────────────────────

// Returned by POST /api/schedules/:facultyId  (addScheduleEntry)
export interface AddEntryResult {
    facultyId: string;
    addedEntry: Omit<ScheduleEntry, "_id">;
    totalEntries: number;
}

// Returned by POST /api/schedules/import  (importSchedule)
export interface ImportResult {
    importId: string;
    status: "success" | "partial" | "failed";
    recordsProcessed: number;
    recordsApplied: number;
    errors: { row: number; message: string }[];
    perFacultyRowCounts: Record<string, { attempted: number; valid: number }>;
}

// ── Helper — derive the frontend-only fields from raw API data ────────────────


function formatPHTime(hhmm: string): string {
    if (!hhmm) return "";
    return new Intl.DateTimeFormat("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",   // always PH time regardless of browser locale
    }).format(new Date(`1970-01-01T${hhmm}:00+8:00`)); // explicitly treat as PH time
}

export function deriveDisplayFields(
    raw: Omit<FacultySchedule, "time" | "avatarInitials" | "avatarColor" | "status">
): FacultySchedule {
    return {
        ...raw,
        time: `${formatPHTime(raw.startTime)} – ${formatPHTime(raw.endTime)}`,
        avatarInitials: raw.name
            .split(" ")
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")
            .slice(0, 2),
        avatarColor: ["#0A3D91", "#002f73", "#FF5733", "#28A745"][raw.name.length % 4],
        status: "AVAILABLE",   // default until a real presence/status API exists
    };
}