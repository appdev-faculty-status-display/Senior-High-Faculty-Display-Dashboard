// types/schedule.ts

import { formatPHTimeRange } from "@/utils/phTime";

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

// Status is a frontend-only display concept — never stored in the DB.
export type Status =
    | "AVAILABLE"
    | "IN CLASS"
    | "OFF CAMPUS"
    | "DO NOT DISTURB"
    | "IN MEETING"
    | "ON BREAK";

// ── Backend sub-document (faculty.schedule[]) ─────────────────────────────────
// Mirrors the shape persisted inside the Faculty MongoDB document.
// _id is omitted — scheduleEntrySchema has _id: false so subdocs have no id.

export interface ScheduleEntry {
    day:       Day;
    startTime: string;  // "HH:MM" PH local time, 24-hour — e.g. "07:30"
    endTime:   string;  // "HH:MM" PH local time, 24-hour — e.g. "09:00"
    subject:   string;
    room:      string;
}

// ── API response shape for schedule rows ───────────────────────────────────────
// No frontend-only fields. Uses entryKey (composite) instead of _id since
// scheduleEntrySchema has _id: false — entry._id would always be undefined.

export interface ScheduleRowDto {
    facultyId: string;
    mongoId:   string;   // Faculty document _id
    name:      string;
    strand:    Strand;
    entryKey:  string;   // composite: facultyId_day_startTime_endTime
    day:       Day;
    startTime: string;   // "HH:MM" PH local time
    endTime:   string;   // "HH:MM" PH local time
    subject:   string;
    room:      string;
}

// ── Frontend display type (one row in the schedule table) ─────────────────────
// Extends ScheduleRowDto with frontend-only derived fields.
// These fields are never sent to the API.

export interface FacultySchedule extends ScheduleRowDto {
    id:             number;   // stable numeric key derived from index; used as
                              // table row key and EditScheduleModal's onDelete(id)
    time:           string;   // derived: formatPHTimeRange(startTime, endTime)
    status:         Status;   // frontend-only, not persisted in DB
    avatarInitials: string;   // derived from name
    avatarColor:    string;   // derived from name
}

// ── API response shapes ───────────────────────────────────────────────────────

// Returned by POST /api/schedules/:facultyId  (addScheduleEntry)
export interface AddEntryResult {
    facultyId:    string;
    addedEntry:   ScheduleEntry;
    totalEntries: number;
}

// Returned by POST /api/schedules/import  (importSchedule)
export interface ImportResult {
    importId:            string;
    status:              "success" | "partial" | "failed";
    recordsProcessed:    number;
    recordsApplied:      number;
    errors:              { row: number; message: string }[];
    perFacultyRowCounts: Record<string, { attempted: number; valid: number }>;
}

// ── Transformation: ScheduleRowDto → FacultySchedule ─────────────────────────
// Call this after every API response before setting state.
// Keeps all derivation logic in one place.

const AVATAR_COLORS = ["#0A3D91", "#002f73", "#FF5733", "#28A745"];

export function deriveDisplayFields(row: ScheduleRowDto, index: number): FacultySchedule {
    return {
        ...row,
        id:             index + 1,
        time:           formatPHTimeRange(row.startTime, row.endTime),
        status:         "AVAILABLE",
        avatarInitials: row.name
            .split(" ")
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")
            .slice(0, 2),
        avatarColor:    AVATAR_COLORS[row.name.length % AVATAR_COLORS.length],
    };
}