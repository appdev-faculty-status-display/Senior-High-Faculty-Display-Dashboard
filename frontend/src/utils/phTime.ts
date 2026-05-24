// utils/phTime.ts

/**
 * Philippine Time Utilities
 * =========================
 * Philippine Standard Time (PST) is UTC+8, fixed offset, no DST.
 *
 * STORAGE RULE
 * ────────────
 * Times are stored as plain "HH:MM" strings (24-hour, e.g. "07:30", "13:00").
 * These strings represent PH local time directly — no UTC conversion is applied
 * on the way in or out of the database. This is safe because:
 *   - PH has no Daylight Saving Time adjustments (offset is always +08:00)
 *   - HH:MM string comparison is therefore chronologically correct (see below)
 *   - No timezone ambiguity exists for any stored value
 *
 * DISPLAY RULE
 * ────────────
 * Always pass timeZone: 'Asia/Manila' to Intl.DateTimeFormat when rendering
 * times for the user. Never rely on the browser's local timezone, because users
 * or developers in other timezones would see incorrect times.
 *
 * CONFLICT DETECTION RULE
 * ───────────────────────
 * HH:MM strings can be compared with < > === directly (lexicographic order
 * matches chronological order for zero-padded 24-hour strings). This works
 * because there is no DST offset shift that could make "13:00" mean a different
 * wall-clock hour on different dates.
 *
 * IMPORT RULE
 * ───────────
 * Excel import files must contain times already in PH local time (UTC+8).
 * The import template documents this explicitly. The backend stores values as-is
 * with no conversion. If a user enters UTC or another timezone offset, times
 * will be stored and displayed incorrectly — there is no server-side correction.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** IANA timezone identifier for Philippine Standard Time. */
export const PH_TIMEZONE = "Asia/Manila" as const;

/** UTC offset label shown to users in forms and the import template. */
export const PH_UTC_OFFSET = "UTC+8" as const;

/** Regex for validating a stored HH:MM time string. */
const HHMM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Returns true if the value is a valid HH:MM 24-hour string.
 * Use this on both the frontend (form validation) and to guard
 * before passing a value to any other function in this module.
 *
 * @example
 * isValidHHMM("07:30")  // true
 * isValidHHMM("7:30")   // false — must be zero-padded
 * isValidHHMM("25:00")  // false
 * isValidHHMM("")        // false
 */
export function isValidHHMM(value: string): boolean {
    return HHMM_PATTERN.test(value);
}

// ── Display ───────────────────────────────────────────────────────────────────

/**
 * Formats a stored HH:MM string into a 12-hour time label for display,
 * always in Philippine Standard Time (Asia/Manila).
 *
 * The browser's local timezone is intentionally ignored — Intl.DateTimeFormat
 * is locked to Asia/Manila so output is correct for all users regardless of
 * where they are running the app.
 *
 * A fixed epoch date (1970-01-01) is used as a carrier for the time value.
 * This is safe because PH has no DST: "07:30 on 1970-01-01 in Asia/Manila"
 * has the same UTC offset as "07:30 on any other date in Asia/Manila".
 *
 * @example
 * formatPHTime("07:30")  // "07:30 AM"
 * formatPHTime("13:00")  // "01:00 PM"
 * formatPHTime("00:00")  // "12:00 AM"
 */
export function formatPHTime(hhmm: string): string {
    if (!isValidHHMM(hhmm)) return hhmm; // return as-is rather than crash

    return new Intl.DateTimeFormat("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: PH_TIMEZONE,   // ← never omit this
    }).format(new Date(`1970-01-01T${hhmm}:00+8:00`));
}

/**
 * Formats a start + end HH:MM pair into the display string used in the
 * schedule table's Time column.
 *
 * @example
 * formatPHTimeRange("07:30", "09:00")  // "07:30 AM – 09:00 AM"
 * formatPHTimeRange("13:00", "14:30")  // "01:00 PM – 02:30 PM"
 */
export function formatPHTimeRange(startTime: string, endTime: string): string {
    return `${formatPHTime(startTime)} – ${formatPHTime(endTime)}`;
}

// ── Conflict detection ────────────────────────────────────────────────────────

/**
 * Returns true if two time ranges overlap.
 *
 * HH:MM strings are compared lexicographically, which is safe for chronological
 * ordering because:
 *   1. The strings are always zero-padded 24-hour format ("07:30", not "7:30")
 *   2. PH has no DST — the offset never shifts, so no two times on the same day
 *      can be equal when expressed in HH:MM but at different UTC instants
 *
 * Two ranges are considered overlapping if one starts before the other ends.
 * Ranges that share only an endpoint (e.g. 07:30–09:00 and 09:00–10:30) are
 * treated as non-overlapping (back-to-back classes are allowed).
 *
 * @example
 * doRangesOverlap("07:30", "09:00", "08:00", "10:00")  // true  — partial overlap
 * doRangesOverlap("07:30", "09:00", "09:00", "10:30")  // false — back-to-back
 * doRangesOverlap("07:30", "09:00", "10:00", "11:00")  // false — no overlap
 */
export function doRangesOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string
): boolean {
    return startA < endB && startB < endA;
}

/**
 * Returns true if a proposed new entry conflicts with any existing entry
 * on the same day. Use this on the frontend before submitting to the API,
 * and mirror the same logic in the backend addEntry service.
 *
 * @example
 * const existing = [{ day: "Monday", startTime: "07:30", endTime: "09:00" }];
 * hasTimeConflict("Monday", "08:00", "10:00", existing)  // true
 * hasTimeConflict("Monday", "09:00", "10:30", existing)  // false
 * hasTimeConflict("Tuesday", "08:00", "10:00", existing) // false — different day
 */
export function hasTimeConflict(
    day: string,
    startTime: string,
    endTime: string,
    existingEntries: { day: string; startTime: string; endTime: string }[]
): boolean {
    return existingEntries.some(
        (entry) =>
            entry.day === day &&
            doRangesOverlap(startTime, endTime, entry.startTime, entry.endTime)
    );
}

// ── Import template documentation ─────────────────────────────────────────────

/**
 * Human-readable instructions written into the "Instructions" sheet of the
 * XLSX import template (used by DownloadTemplateButton).
 *
 * Exported as a constant so the template generator and any future
 * documentation pages share the exact same wording.
 */
export const IMPORT_TIME_INSTRUCTIONS = [
    {
        Field: "startTime",
        Format: "HH:MM",
        Timezone: `PH local time (${PH_UTC_OFFSET}, Asia/Manila)`,
        Example: "07:30",
        Notes:
            "24-hour zero-padded format. Must be in Philippine Standard Time — " +
            "do NOT convert to UTC before entering. The system stores and displays " +
            "this value as-is. 7:30 AM PST = 07:30, 1:00 PM PST = 13:00.",
    },
    {
        Field: "endTime",
        Format: "HH:MM",
        Timezone: `PH local time (${PH_UTC_OFFSET}, Asia/Manila)`,
        Example: "09:00",
        Notes:
            "Must be later than startTime on the same day. " +
            "Back-to-back entries (e.g. 07:30–09:00 and 09:00–10:30) are allowed.",
    },
] as const;