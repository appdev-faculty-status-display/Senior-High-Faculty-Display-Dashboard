// components/modal/AddScheduleModal.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FacultySchedule, Day, AddEntryResult } from "../../types/schedule";
import { doRangesOverlap, formatPHTime, isValidHHMM } from "../../utils/phTime";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getFacultyList, type FacultyRecord } from "@/lib/facultyApi";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "") + "/api";

interface Props {
    onClose: () => void;
    onSaved: (result: AddEntryResult) => void;
    existingSchedules: FacultySchedule[];
}

const DAYS = ["All Days", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ROOMS = ["All Rooms", "101", "102", "103", "104", "105", "106", "Lab 1", "Lab 2"];
const VALID_DAYS = DAYS.filter((day) => day !== "All Days") as Day[];
const VALID_ROOMS = ROOMS.filter((room) => room !== "All Rooms");
const SUBJECT_OPTIONS = [
    "General Mathematics",
    "Pre-Calculus",
    "Earth and Life Science",
    "Business Mathematics",
    "Linguistics",
    "Oral Communication",
    "Reading and Writing",
    "Practical Research",
    "Basic Calculus",
];

interface SearchOption {
    key: string;
    label: string;
    description?: string;
}

function addMinutesToHHMM(hhmm: string, minutesToAdd: number): string {
    if (!isValidHHMM(hhmm)) return "";

    const [hours, minutes] = hhmm.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
    const nextHours = Math.floor(wrapped / 60);
    const nextMinutes = wrapped % 60;
    return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function SearchableField({
    label,
    required,
    query,
    options,
    placeholder,
    helperText,
    onQueryChange,
    onPick,
}: {
    label: string;
    required?: boolean;
    query: string;
    options: SearchOption[];
    placeholder: string;
    helperText?: string;
    onQueryChange: (value: string) => void;
    onPick: (option: SearchOption) => void;
}) {
    const [open, setOpen] = useState(false);
    const blurTimer = useRef<number | null>(null);

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        return options
            .filter((option) => {
                if (!q) return true;
                return (
                    option.key.toLowerCase().includes(q) ||
                    option.label.toLowerCase().includes(q) ||
                    option.description?.toLowerCase().includes(q) === true
                );
            })
            .slice(0, 7);
    }, [options, query]);

    useEffect(() => {
        return () => {
            if (blurTimer.current) window.clearTimeout(blurTimer.current);
        };
    }, []);

    return (
        <div className="relative flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.18em]">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
                type="text"
                value={query}
                placeholder={placeholder}
                onChange={(e) => {
                    onQueryChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    blurTimer.current = window.setTimeout(() => setOpen(false), 120);
                }}
                className="w-full rounded-none border border-[#cbd5e1] bg-[#f8fbff] px-4 py-3 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-[#002f73] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            {helperText && <p className="text-[11px] text-gray-400">{helperText}</p>}
            {open && matches.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-none border border-[#dbe5f4] bg-white shadow-lg">
                    {matches.map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onPick(option);
                                setOpen(false);
                            }}
                            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-blue-50"
                        >
                            <span className="font-semibold text-[#002f73]">{option.label}</span>
                            <span className="font-mono text-[11px] text-gray-400">{option.description ?? option.key}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function SelectField({
    label,
    required,
    value,
    options,
    onChange,
}: {
    label: string;
    required?: boolean;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.18em]">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full appearance-none rounded-none border border-[#cbd5e1] bg-[#f8fbff] px-4 py-3 pr-10 text-sm text-gray-800 outline-none transition-all focus:border-[#002f73] focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                    <option value="">Select an option</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌵</span>
            </div>
        </div>
    );
}

export default function AddScheduleModal({ onClose, onSaved, existingSchedules }: Props) {
    const [facultyQuery, setFacultyQuery] = useState("");
    const [selectedFacultyId, setSelectedFacultyId] = useState("");
    const [facultyOptions, setFacultyOptions] = useState<FacultyRecord[]>([]);
    const [facultyLoading, setFacultyLoading] = useState(true);
    const [facultyLoadError, setFacultyLoadError] = useState<string | null>(null);

    const [subjectQuery, setSubjectQuery] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");

    const [day, setDay] = useState<Day>(VALID_DAYS[0]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [room, setRoom] = useState(VALID_ROOMS[0] ?? "");

    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setFacultyLoading(true);
        getFacultyList()
            .then((result) => {
                if (!active) return;
                setFacultyOptions(result.data);
                setFacultyLoadError(null);
            })
            .catch(() => {
                if (!active) return;
                setFacultyLoadError("Unable to load faculty lookup data.");
            })
            .finally(() => {
                if (!active) return;
                setFacultyLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!successMessage) return;

        const timer = window.setTimeout(() => {
            setSuccessMessage(null);
        }, 15000);

        return () => window.clearTimeout(timer);
    }, [successMessage]);

    const facultyById = useMemo(() => new Map(facultyOptions.map((faculty) => [faculty.facultyId, faculty])), [facultyOptions]);
    const subjectOptions = useMemo(() => {
        return Array.from(
            new Set([
                ...SUBJECT_OPTIONS,
                ...existingSchedules.map((schedule) => schedule.subject).filter(Boolean),
            ])
        ).sort((a, b) => a.localeCompare(b));
    }, [existingSchedules]);

    const facultyOptionsForLookup = useMemo<SearchOption[]>(() => {
        return facultyOptions.map((faculty) => ({
            key: faculty.facultyId,
            label: faculty.name,
            description: faculty.facultyId,
        }));
    }, [facultyOptions]);

    const subjectOptionsForLookup = useMemo<SearchOption[]>(() => {
        return subjectOptions.map((subject) => ({ key: subject, label: subject }));
    }, [subjectOptions]);

    const selectedFaculty = facultyById.get(selectedFacultyId) ?? null;
    const facultyLookupHint = facultyLoading
        ? "Loading faculty list..."
        : facultyLoadError ?? "Type a name or Faculty ID, then pick a match from the list.";

    const resolveFacultyFromQuery = useCallback((query: string): FacultyRecord | null => {
        const trimmed = query.trim().toLowerCase();
        if (!trimmed) return null;
        return (
            facultyOptions.find((faculty) => faculty.facultyId.toLowerCase() === trimmed) ??
            facultyOptions.find((faculty) => faculty.name.toLowerCase() === trimmed) ??
            null
        );
    }, [facultyOptions]);

    const resolveSubjectFromQuery = useCallback((query: string): string => {
        const trimmed = query.trim();
        if (!trimmed) return "";
        return subjectOptions.find((subject) => subject.toLowerCase() === trimmed.toLowerCase()) ?? "";
    }, [subjectOptions]);

    const sameRoomConflict = useMemo(() => {
        if (!day || !room.trim() || !isValidHHMM(startTime) || !isValidHHMM(endTime)) return null;
        return existingSchedules.find((entry) =>
            entry.day === day &&
            entry.room === room.trim() &&
            doRangesOverlap(startTime, endTime, entry.startTime, entry.endTime)
        ) ?? null;
    }, [day, room, startTime, endTime, existingSchedules]);

    const sameFacultyConflict = useMemo(() => {
        if (!day || !selectedFacultyId || !isValidHHMM(startTime) || !isValidHHMM(endTime)) return null;
        return existingSchedules.find((entry) =>
            entry.day === day &&
            entry.facultyId === selectedFacultyId &&
            doRangesOverlap(startTime, endTime, entry.startTime, entry.endTime)
        ) ?? null;
    }, [day, selectedFacultyId, startTime, endTime, existingSchedules]);

    const liveMessage = useMemo(() => {
        const resolvedFaculty = selectedFaculty ?? resolveFacultyFromQuery(facultyQuery);
        const resolvedSubject = selectedSubject || resolveSubjectFromQuery(subjectQuery);

        if (facultyQuery.trim() && !resolvedFaculty) {
            return { type: "warning" as const, message: "Pick a faculty member from the lookup list." };
        }

        if (subjectQuery.trim() && !resolvedSubject) {
            return { type: "warning" as const, message: "Choose a valid subject from the dropdown suggestions." };
        }

        if (startTime && !isValidHHMM(startTime)) {
            return { type: "error" as const, message: "Start time must be a valid HH:MM 24-hour value." };
        }

        if (endTime && !isValidHHMM(endTime)) {
            return { type: "error" as const, message: "End time must be a valid HH:MM 24-hour value." };
        }

        if (isValidHHMM(startTime) && isValidHHMM(endTime) && startTime >= endTime) {
            return { type: "error" as const, message: "End time must be later than start time." };
        }

        if (sameRoomConflict) {
            return {
                type: "error" as const,
                message: `Room ${sameRoomConflict.room} is already booked for ${sameRoomConflict.name} from ${formatPHTime(sameRoomConflict.startTime)} to ${formatPHTime(sameRoomConflict.endTime)} on ${sameRoomConflict.day}.`,
            };
        }

        if (sameFacultyConflict) {
            return {
                type: "error" as const,
                message: `${sameFacultyConflict.name} already has a schedule during that time on ${sameFacultyConflict.day}.`,
            };
        }

        return null;
    }, [
        facultyQuery,
        endTime,
        sameFacultyConflict,
        sameRoomConflict,
        selectedFaculty,
        selectedSubject,
        subjectQuery,
        startTime,
        resolveFacultyFromQuery,
        resolveSubjectFromQuery,
    ]);

    const canSave = Boolean(
        selectedFaculty &&
        selectedSubject &&
        day &&
        room.trim() &&
        isValidHHMM(startTime) &&
        isValidHHMM(endTime) &&
        startTime < endTime &&
        !sameRoomConflict &&
        !sameFacultyConflict &&
        !isLoading
    );

    function resetForAnotherEntry() {
        setSubjectQuery("");
        setSelectedSubject("");
        setStartTime("");
        setEndTime("");
        setSubmitError(null);
        setSuccessMessage(null);
    }

    function handleStartTimeChange(value: string) {
        setStartTime(value);
        setSubmitError(null);
        setSuccessMessage(null);
        if (isValidHHMM(value)) {
            const suggestedEnd = addMinutesToHHMM(value, 60);
            if (!isValidHHMM(endTime) || endTime <= value) {
                setEndTime(suggestedEnd);
            }
        }
    }

    async function handleSave() {
        setSubmitError(null);
        setSuccessMessage(null);

        const resolvedFaculty = selectedFaculty ?? resolveFacultyFromQuery(facultyQuery);
        const resolvedSubject = selectedSubject || resolveSubjectFromQuery(subjectQuery);

        if (!resolvedFaculty) {
            setSubmitError("Select a faculty member from the lookup list.");
            return;
        }

        if (!resolvedSubject) {
            setSubmitError("Select a valid subject from the dropdown.");
            return;
        }

        if (!room.trim()) {
            setSubmitError("Room is required.");
            return;
        }

        if (!isValidHHMM(startTime)) {
            setSubmitError("Start time must be in HH:MM 24-hour format.");
            return;
        }

        if (!isValidHHMM(endTime)) {
            setSubmitError("End time must be in HH:MM 24-hour format.");
            return;
        }

        if (startTime >= endTime) {
            setSubmitError("Start time must be earlier than end time.");
            return;
        }

        if (sameRoomConflict) {
            setSubmitError(`Room ${sameRoomConflict.room} is already booked for that time.`);
            return;
        }

        if (sameFacultyConflict) {
            setSubmitError(`${sameFacultyConflict.name} already has a schedule during that time.`);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`${BASE_URL}/schedule-entries/${encodeURIComponent(resolvedFaculty.facultyId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    day,
                    startTime,
                    endTime,
                    subject: resolvedSubject,
                    room: room.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSubmitError(data?.message ?? "Failed to add schedule entry. Please try again.");
                return;
            }

            onSaved(data as AddEntryResult);
            setSuccessMessage(`Saved ${resolvedFaculty.name}'s schedule entry.`);
            resetForAnotherEntry();
            onClose();
        } catch {
            setSubmitError("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg border border-gray-100 bg-white p-8 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="mb-1 text-xl font-extrabold tracking-tight text-[#002f73]">Add Schedule Entry</h2>
                        <p className="mt-1 text-sm text-gray-500">Look up a faculty member, choose a valid subject, and the form will flag conflicts before saving.</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-xl leading-none text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="border-b-2 border-yellow-400 mb-6 mt-2" />

                <div className="grid grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <SearchableField
                            label="Faculty ID / Name"
                            required
                            query={facultyQuery}
                            options={facultyOptionsForLookup}
                            placeholder="Type part of a name or Faculty ID"
                            helperText={facultyLoadError ?? facultyLoading ? "Loading faculty lookup..." : facultyLookupHint}
                            onQueryChange={(value) => {
                                setFacultyQuery(value);
                                setSubmitError(null);
                                setSuccessMessage(null);
                                const resolved = resolveFacultyFromQuery(value);
                                setSelectedFacultyId(resolved?.facultyId ?? "");
                            }}
                            onPick={(option) => {
                                const resolved = facultyById.get(option.key) ?? null;
                                setFacultyQuery(resolved ? `${resolved.name} (${resolved.facultyId})` : option.label);
                                setSelectedFacultyId(resolved?.facultyId ?? option.key);
                                setSubmitError(null);
                                setSuccessMessage(null);
                            }}
                        />
                        {selectedFaculty && (
                            <p className="mt-1 text-[11px] text-gray-400">
                                Selected: {selectedFaculty.name} <span className="text-gray-400">({selectedFaculty.facultyId})</span>
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <SearchableField
                            label="Subject"
                            required
                            query={subjectQuery}
                            options={subjectOptionsForLookup}
                            placeholder="Search valid subject names"
                            helperText="Pick from the dropdown to keep subject names consistent."
                            onQueryChange={(value) => {
                                setSubjectQuery(value);
                                setSubmitError(null);
                                setSuccessMessage(null);
                                const resolved = resolveSubjectFromQuery(value);
                                setSelectedSubject(resolved);
                            }}
                            onPick={(option) => {
                                setSubjectQuery(option.label);
                                setSelectedSubject(option.key);
                                setSubmitError(null);
                                setSuccessMessage(null);
                            }}
                        />
                    </div>

                    <SelectField
                        label="Day"
                        required
                        value={day}
                        options={VALID_DAYS}
                        onChange={(value) => {
                            setDay(value as Day);
                            setSubmitError(null);
                            setSuccessMessage(null);
                        }}
                    />

                    <SelectField
                        label="Room"
                        required
                        value={room}
                        options={VALID_ROOMS}
                        onChange={(value) => {
                            setRoom(value);
                            setSubmitError(null);
                            setSuccessMessage(null);
                        }}
                    />

                    <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                            Start Time<span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400 appearance-none"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">When you pick a start time, the end time defaults one hour later.</p>
                        {startTime && isValidHHMM(startTime) && (
                            <p className="mt-1 text-[11px] text-gray-400">Preview: {formatPHTime(startTime)} PST</p>
                        )}
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                            End Time<span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            value={endTime}
                            min={startTime || undefined}
                            onChange={(e) => {
                                setEndTime(e.target.value);
                                setSubmitError(null);
                                setSuccessMessage(null);
                            }}
                            className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400 appearance-none"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">This field is restricted to times after the selected start time.</p>
                        {endTime && isValidHHMM(endTime) && (
                            <p className="mt-1 text-[11px] text-gray-400">Preview: {formatPHTime(endTime)} PST</p>
                        )}
                    </div>
                </div>

                {(liveMessage || submitError || successMessage) && (
                    <div className="mt-5 space-y-3">
                        {liveMessage && (
                            <p className="text-xs font-semibold text-red-500">{liveMessage.message}</p>
                        )}

                        {submitError && (
                            <p className="text-xs font-semibold text-red-500">{submitError}</p>
                        )}

                        {successMessage && (
                            <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{successMessage}</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSuccessMessage(null)}
                                            className="px-3 py-1.5 text-xs font-bold border border-[#cbd5e1] bg-white text-[#002f73] hover:bg-[#f0f4ff] hover:border-[#064db6]"
                                        >
                                            Add another
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-3 py-1.5 text-xs font-bold border border-[#cbd5e1] bg-white text-[#002f73] hover:bg-[#f0f4ff] hover:border-[#064db6]"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="border-b border-gray-100 mt-6 mb-6" />

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
                            disabled={!canSave}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-[#002f73] border border-[#002f73] hover:bg-[#064db6] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? "Saving…" : "Save Entry"}
                        </button>
                </div>
            </div>
        </div>
    );
}