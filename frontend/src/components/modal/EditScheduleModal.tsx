// EditScheduleModal.tsx

import { useState } from "react";
import type { FacultySchedule, Strand, Day } from "../../types/schedule";
import { STRANDS, DAYS, ROOMS } from "../../data/mockAddSchedule";
import { useAuth } from "@/hooks/useAuth";
import { isValidHHMM, formatPHTime } from "@/utils/phTime";

const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

interface Props {
    schedule: FacultySchedule;
    accessToken: string;
    onClose: () => void;
    onSaved: () => void;        // re-fetches after save
    onDelete: (s: FacultySchedule) => void; // passes full schedule for API call
}

export default function EditScheduleModal({ schedule, onClose, onSaved, onDelete }: Props) {
    const { getToken } = useAuth();
    const accessToken = getToken() ?? "";

    // Editable fields — split time back into startTime/endTime
    const [subject, setSubject] = useState(schedule.subject);
    const [strand, setStrand] = useState<Strand>(schedule.strand);
    const [room, setRoom] = useState(schedule.room);
    const [day, setDay] = useState<Day>(schedule.day);
    const [startTime, setStartTime] = useState(schedule.startTime); // HH:MM
    const [endTime, setEndTime] = useState(schedule.endTime);     // HH:MM

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const inputClass = "w-full border border-gray-300 px-2 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400 appearance-none pr-8";
    const labelClass = "block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1";
    const selectChevron = (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">⌵</span>
    );

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setError(null);

        // Client-side validation
        if (!isValidHHMM(startTime)) { setError("Start time must be in HH:MM 24-hour format."); return; }
        if (!isValidHHMM(endTime))   { setError("End time must be in HH:MM 24-hour format.");   return; }
        if (startTime >= endTime)    { setError("Start time must be earlier than end time.");    return; }

        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/schedule-entries/${encodeURIComponent(schedule.facultyId)}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    entryKey: schedule.entryKey, // identifies which sub-doc to update
                    day,
                    startTime,
                    endTime,
                    subject,
                    room,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data?.message ?? "Failed to save changes.");
                return;
            }

            onSaved(); // re-fetches the table
            onClose();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white shadow-lg w-full max-w-lg p-8 border border-gray-100">
                <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
                    Edit Schedule
                </h2>
                <div className="border-b-2 border-yellow-400 mb-6" />

                <div className="grid grid-cols-2 gap-4">
                    {/* Faculty name — read only, not editable per entry */}
                    <div className="col-span-2">
                        <label className={labelClass}>Faculty Member</label>
                        <input
                            type="text"
                            value={schedule.name}
                            disabled
                            className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Subject</label>
                        <input 
                            type="text" 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)} 
                            className={inputClass} 
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Strand</label>
                        <div className="relative">
                            <select value={strand} onChange={(e) => setStrand(e.target.value as Strand)} className={inputClass}>
                                {STRANDS.filter((s) => s !== "All Strands").map((s) => <option key={s}>{s}</option>)}
                            </select>
                            {selectChevron}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Room</label>
                        <div className="relative">
                            <select value={room} onChange={(e) => setRoom(e.target.value)} className={inputClass}>
                                {ROOMS.filter((r) => r !== "All Rooms").map((r) => <option key={r}>{r}</option>)}
                            </select>
                            {selectChevron}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Day</label>
                        <div className="relative">
                            <select value={day} onChange={(e) => setDay(e.target.value as Day)} className={inputClass}>
                                {DAYS.filter((d) => d !== "All Days").map((d) => <option key={d}>{d}</option>)}
                            </select>
                            {selectChevron}
                        </div>
                    </div>

                    {/* Start time — HH:MM, replaces the old combined "time" text input */}
                    <div>
                        <label className={labelClass}>
                            Start Time
                            <span className="ml-1 font-normal normal-case text-gray-400">(24-hr PST)</span>
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={inputClass}
                        />
                        {startTime && isValidHHMM(startTime) && (
                            <p className="text-[11px] text-gray-400 mt-1">{formatPHTime(startTime)} PST</p>
                        )}
                    </div>

                    {/* End time */}
                    <div>
                        <label className={labelClass}>
                            End Time
                            <span className="ml-1 font-normal normal-case text-gray-400">(24-hr PST)</span>
                        </label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={inputClass}
                        />
                        {endTime && isValidHHMM(endTime) && (
                            <p className="text-[11px] text-gray-400 mt-1">{formatPHTime(endTime)} PST</p>
                        )}
                    </div>

                    {/* Status — frontend only, managed by system */}
                    <div>
                        <label className={labelClass}>Status</label>
                        <div className="relative">
                            <select disabled className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}>
                                <option>{schedule.status}</option>
                            </select>
                            {selectChevron}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">Managed by faculty status system</p>
                    </div>
                </div>

                {/* Error Banner */}
                {error && <p className="text-xs text-red-500 font-semibold mt-4">{error}</p>}

                <div className="border-b border-gray-100 mt-6 mb-6" />

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => { onDelete(schedule); onClose(); }}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-500 border border-[#cbd5e1] bg-white hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                    >
                        Delete
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors disabled:opacity-50"
                    >
                        {isLoading ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}