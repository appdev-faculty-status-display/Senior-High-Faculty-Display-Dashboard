// addSchedule.tsx

import { useState, useEffect, useCallback } from "react";
import type { FacultySchedule } from "@/types/schedule";
import {
    STRANDS,
    DAYS,
    ROOMS,
    ROWS_PER_PAGE,
} from "@/data/mockAddSchedule";                         
import StatusBadge from "@/components/StatusBadge";
import SelectFilter from "@/components/SelectFilter";
import IconEdit from "@/components/icons/EditIcon";
import IconTrash from "@/components/icons/TrashIcon";
import IconSearch from "@/components/icons/SearchIcon";
import EditScheduleModal from "@/components/modal/EditScheduleModal";
import ImportScheduleModal from "@/components/modal/ImportScheduleModal";
import AddScheduleModal from "@/components/modal/AddScheduleModal";
import DownloadTemplateButton from "@/components/DownloadTemplateButton";
import { useAuth } from "@/hooks/useAuth";                

export default function ClassScheduleDashboard() {
    const { getToken } = useAuth();
    const accessToken = getToken() ?? "";                    

    const [strandFilter, setStrandFilter] = useState("All Strands");
    const [dayFilter, setDayFilter] = useState("All Days");
    const [roomFilter, setRoomFilter] = useState("All Rooms");
    const [search, setSearch] = useState("");
    const [schedulePage, setSchedulePage] = useState(1);

    const [schedules, setSchedules] = useState<FacultySchedule[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const [isImporting, setIsImporting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<FacultySchedule | null>(null);

    // ── Fetch schedules from API ───────────────────────────────────────────────
    // Defined with useCallback so it can be passed to onSaved without re-creating
    // on every render. Called on mount and after AddScheduleModal saves successfully.
    const fetchSchedules = useCallback(async () => {      // ← resolves "Cannot find name 'fetchSchedules'"
        if (!accessToken) return;
        setIsFetching(true);
        try {
            const res = await fetch("/api/schedules", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data: FacultySchedule[] = await res.json();
            setSchedules(data);
        } catch (err) {
            console.error("Failed to fetch schedules:", err);
        } finally {
            setIsFetching(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    // ── Filtering + pagination ─────────────────────────────────────────────────
    const filtered = schedules.filter((s) => {
        const matchStrand = strandFilter === "All Strands" || s.strand === strandFilter;
        const matchDay    = dayFilter    === "All Days"    || s.day    === dayFilter;
        const matchRoom   = roomFilter   === "All Rooms"   || s.room   === roomFilter;
        const matchSearch =
            search === "" ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.subject.toLowerCase().includes(search.toLowerCase());
        return matchStrand && matchDay && matchRoom && matchSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const paginated  = filtered.slice(
        (schedulePage - 1) * ROWS_PER_PAGE,
        schedulePage * ROWS_PER_PAGE
    );

    const deleteSchedule = (id: number) =>
        setSchedules((prev) => prev.filter((s) => s.id !== id));

    const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
        setter(value);
        setSchedulePage(1);
    };

    return (
        <section className="min-h-screen w-full bg-gray-50 p-6">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#002f73] uppercase">
                        Manage Class Schedules
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Create, edit, and manage all class schedules.
                    </p>
                </div>

                {/* Action buttons — Download Template sits beside Add Schedule */}
                <div className="flex items-center gap-3">
                    <DownloadTemplateButton />

                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] transition-colors"
                    >
                        <svg
                            width="16" height="16" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="inline-block"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Schedule
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden h-full">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
                    <SelectFilter value={strandFilter} onChange={handleFilterChange(setStrandFilter)} options={STRANDS} />
                    <SelectFilter value={dayFilter}    onChange={handleFilterChange(setDayFilter)}    options={DAYS}    />
                    <SelectFilter value={roomFilter}   onChange={handleFilterChange(setRoomFilter)}   options={ROOMS}   />
                    <div className="flex items-center border border-gray-200 px-3 py-2 bg-white flex-1 min-w-40 gap-2">
                        <IconSearch />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setSchedulePage(1); }}
                            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#002f73] text-white text-xs font-bold uppercase tracking-wider">
                                <th className="text-left px-4 py-3">Faculty Member</th>
                                <th className="text-left px-4 py-3">Subject</th>
                                <th className="text-left px-4 py-3">Strand</th>
                                <th className="text-left px-4 py-3">Room</th>
                                <th className="text-left px-4 py-3">Status</th>
                                <th className="text-left px-4 py-3">Time</th>
                                <th className="text-left px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isFetching ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-400">
                                        Loading…
                                    </td>
                                </tr>
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-400">
                                        No schedules found.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((s) => (
                                    <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.avatarColor}`}>
                                                    {s.avatarInitials}
                                                </span>
                                                <span className="font-medium text-gray-800 whitespace-nowrap">
                                                    {s.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{s.subject}</td>
                                        <td className="px-4 py-3 font-semibold text-[#002f73]">{s.strand}</td>
                                        <td className="px-4 py-3 text-gray-600">{s.room}</td>
                                        <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{s.time}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setSelectedSchedule(s); setIsEditing(true); }}
                                                    className="p-1.5 hover:bg-blue-100 text-[#002f73] transition-colors"
                                                >
                                                    <IconEdit />
                                                </button>
                                                <button
                                                    onClick={() => deleteSchedule(s.id)}
                                                    className="p-1.5 hover:bg-red-100 text-red-400 transition-colors"
                                                >
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                    <span>
                        Showing{" "}
                        {filtered.length === 0 ? 0 : (schedulePage - 1) * ROWS_PER_PAGE + 1} to{" "}
                        {Math.min(schedulePage * ROWS_PER_PAGE, filtered.length)} of {filtered.length} entries
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                            disabled={schedulePage === 1}
                            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            &lt;
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                            <button
                                key={pg}
                                onClick={() => setSchedulePage(pg)}
                                className={`w-7 h-7 text-xs font-semibold transition-colors ${
                                    pg === schedulePage
                                        ? "bg-[#002f73] text-white shadow-sm"
                                        : "hover:bg-gray-100 text-gray-600"
                                }`}
                            >
                                {pg}
                            </button>
                        ))}
                        <button
                            onClick={() => setSchedulePage((p) => Math.min(totalPages, p + 1))}
                            disabled={schedulePage === totalPages}
                            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Schedule Modal */}
            {isAdding && (
                <AddScheduleModal
                    accessToken={accessToken}
                    onClose={() => setIsAdding(false)}
                    onSaved={() => {
                        fetchSchedules();               // now defined above, no TS error
                        setIsAdding(false);
                    }}
                />
            )}

            {/* Import Schedule Modal */}
            {isImporting && (
                <ImportScheduleModal
                    accessToken={accessToken}
                    onClose={() => setIsImporting(false)}
                    onImportComplete={() => {           // ← was onImport; matches updated Props
                        fetchSchedules();               // re-fetch after bulk import too
                        setIsImporting(false);
                    }}
                />
            )}

            {/* Edit Schedule Modal */}
            {isEditing && selectedSchedule && (
                <EditScheduleModal
                    schedule={selectedSchedule}
                    onClose={() => { setIsEditing(false); setSelectedSchedule(null); }}
                    onSave={(updated: FacultySchedule) => {
                        setSchedules((prev) => prev.map((s) => s.id === updated.id ? updated : s));
                        setIsEditing(false);
                        setSelectedSchedule(null);
                    }}
                    onDelete={(id: number) => {
                        deleteSchedule(id);
                        setIsEditing(false);
                        setSelectedSchedule(null);
                    }}
                />
            )}
        </section>
    );
}