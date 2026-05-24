// components/modal/AddScheduleModal.tsx

import { useState } from "react";
import type { Day } from "../../types/schedule";
import { DAYS, ROOMS } from "../../data/mockAddSchedule";

// Types

interface AddEntryResult {
    facultyId: string;
    addedEntry: {
        day: string;
        startTime: string;
        endTime: string;
        subject: string;
        room: string;
    };
    totalEntries: number;
}

interface Props {
    onClose: () => void;
    onSaved: (result: AddEntryResult) => void; // parent re-fetches or appends the new entry
    accessToken: string;
}

// Helpers

/**
 * Formats a stored HH:MM string (PH local time) into a readable 12-hour label
 * for display only. All formatting is locked to Asia/Manila so the output is
 * always in Philippine Standard Time regardless of the browser's locale.
 */
function formatPHTime(hhmm: string): string {
    if (!hhmm) return "";
    return new Intl.DateTimeFormat("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Manila",
    }).format(new Date(`1970-01-01T${hhmm}:00`));
}

const VALID_DAYS = DAYS.filter((d) => d !== "All Days") as Day[];
const VALID_ROOMS = ROOMS.filter((r) => r !== "All Rooms");

// Component

export default function AddScheduleModal({ onClose, onSaved, accessToken }: Props) {
    // Fields that map 1-to-1 with the backend addEntry payload
    const [facultyId, setFacultyId] = useState("");
    const [day, setDay]             = useState<Day>(VALID_DAYS[0]);
    const [startTime, setStartTime] = useState("");   // HH:MM, PH time
    const [endTime, setEndTime]     = useState("");   // HH:MM, PH time
    const [subject, setSubject]     = useState("");
    const [room, setRoom]           = useState(VALID_ROOMS[0] ?? "");

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]         = useState<string | null>(null);

    // ── Client-side guard (mirrors service validateTimeEntry) ─────────────────
    // Catches the obvious mistakes before the round-trip, but the service
    // is the authoritative validator — errors from the API are surfaced too.
    function validateLocally(): string | null {
        if (!facultyId.trim())    return "Faculty ID is required.";
        if (!subject.trim())      return "Subject is required.";
        if (!room.trim())         return "Room is required.";

        const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (!timePattern.test(startTime)) return "Start time must be in HH:MM 24-hour format (e.g. 07:30).";
        if (!timePattern.test(endTime))   return "End time must be in HH:MM 24-hour format (e.g. 09:00).";
        if (startTime >= endTime)         return "Start time must be earlier than end time.";

        return null;
    }

    // Submit
    const handleSave = async () => {
        setError(null);

        const localError = validateLocally();
        if (localError) { setError(localError); return; }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/schedules/${encodeURIComponent(facultyId.trim())}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ day, startTime, endTime, subject, room }),
            });

            const data = await res.json();

            if (!res.ok) {
                // Surface the backend message (ValidationError, NotFoundError, ForbiddenError)
                setError(data?.message ?? "Failed to add schedule entry. Please try again.");
                return;
            }

            onSaved(data as AddEntryResult);
            onClose();
        } catch {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Shared style tokens (matches EditScheduleModal exactly) ───────────────
    const inputClass  = "w-full border border-gray-300 px-2 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400 appearance-none pr-8";
    const labelClass  = "block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1";
    const selectChevron = (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            ⌵
        </span>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white shadow-lg w-full max-w-lg p-8 border border-gray-100">

                {/* Header */}
                <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
                    Add Schedule Entry
                </h2>
                <div className="border-b-2 border-yellow-400 mb-6" />

                {/* Form grid — same 2-col layout as EditScheduleModal */}
                <div className="grid grid-cols-2 gap-4">

                    {/* Faculty ID — full width, identifies which Faculty document to update */}
                    <div className="col-span-2">
                        <label className={labelClass}>Faculty ID</label>
                        <input
                            type="text"
                            value={facultyId}
                            onChange={(e) => setFacultyId(e.target.value)}
                            placeholder="e.g. FAC-001"
                            className={inputClass}
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className={labelClass}>Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. General Mathematics"
                            className={inputClass}
                        />
                    </div>

                    {/* Room */}
                    <div>
                        <label className={labelClass}>Room</label>
                        <div className="relative">
                            <select
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                className={inputClass}
                            >
                                {VALID_ROOMS.map((r) => (
                                    <option key={r}>{r}</option>
                                ))}
                            </select>
                            {selectChevron}
                        </div>
                    </div>

                    {/* Day */}
                    <div>
                        <label className={labelClass}>Day</label>
                        <div className="relative">
                            <select
                                value={day}
                                onChange={(e) => setDay(e.target.value as Day)}
                                className={inputClass}
                            >
                                {VALID_DAYS.map((d) => (
                                    <option key={d}>{d}</option>
                                ))}
                            </select>
                            {selectChevron}
                        </div>
                    </div>

                    {/* Start time — HH:MM input, PH local time */}
                    <div>
                        <label className={labelClass}>
                            Start Time
                            <span className="ml-1 font-normal normal-case text-gray-400">(HH:MM, 24-hr PST)</span>
                        </label>
                        <input
                            type="time"   // renders a native time picker; value is always HH:MM
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={inputClass}
                        />
                        {/* Preview in 12-hour PH time so the user can sanity-check */}
                        {startTime && (
                            <p className="text-[11px] text-gray-400 mt-1">{formatPHTime(startTime)} PST</p>
                        )}
                    </div>

                    {/* End time */}
                    <div>
                        <label className={labelClass}>
                            End Time
                            <span className="ml-1 font-normal normal-case text-gray-400">(HH:MM, 24-hr PST)</span>
                        </label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={inputClass}
                        />
                        {endTime && (
                            <p className="text-[11px] text-gray-400 mt-1">{formatPHTime(endTime)} PST</p>
                        )}
                    </div>

                </div>

                {/* Inline error */}
                {error && (
                    <p className="text-xs text-red-500 font-semibold mt-4">{error}</p>
                )}

                <div className="border-b border-gray-100 mt-6 mb-6" />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Saving…" : "Save Entry"}
                    </button>
                </div>

            </div>
        </div>
    );
}