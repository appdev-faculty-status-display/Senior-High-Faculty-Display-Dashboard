// addSchedule.tsx

import { useState } from "react";
import type { FacultySchedule } from "@/types/schedule";
import { STRANDS, DAYS, ROOMS, ROWS_PER_PAGE } from "@/data/mockAddSchedule";

import { useAuth }            from "@/hooks/useAuth";
import { useSchedules }       from "@/hooks/useSchedules";
import { useScheduleFilters } from "@/hooks/useScheduleFilters";

import StatusBadge            from "@/components/StatusBadge";
import SelectFilter           from "@/components/SelectFilter";
import IconEdit               from "@/components/icons/EditIcon";
import IconTrash              from "@/components/icons/TrashIcon";
import IconSearch             from "@/components/icons/SearchIcon";
import EditScheduleModal      from "@/components/modal/EditScheduleModal";
import ImportScheduleModal    from "@/components/modal/ImportScheduleModal";
import AddScheduleModal       from "@/components/modal/AddScheduleModal";
import DownloadTemplateButton from "@/components/DownloadTemplateButton";

const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api'; 

export default function ClassScheduleDashboard() {
    const { getToken } = useAuth();
    const accessToken  = getToken() ?? "";

    const { schedules, setSchedules, isFetching, fetchError, fetchSchedules } =
        useSchedules(accessToken);

    const {
        strandFilter, dayFilter, roomFilter, search, schedulePage,
        setStrandFilter, setDayFilter, setRoomFilter, setSearch, setSchedulePage,
        handleFilterChange, filtered, paginated, totalPages,
    } = useScheduleFilters(schedules);

    const [isAdding,         setIsAdding]         = useState(false);
    const [isImporting,      setIsImporting]      = useState(false);
    const [isEditing,        setIsEditing]        = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<FacultySchedule | null>(null);

    const handleDelete = async (s: FacultySchedule) => {
        try {
            const res = await fetch (`${BASE_URL}/schedule/${encodeURIComponent(s.facultyId)}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ entryKey: s.entryKey }),
            }); 

            if (res.ok) {
                setSchedules((prev) => prev.filter((r) => r.entryKey !== s.entryKey));
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData?.message ?? "Failed to delete schedule entry from the server.");
            }
        } catch {
            console.error("Failed to delete schedule entry.");
        }
    }

    return (
        <section className="min-h-screen w-full bg-gray-50 p-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#002f73] uppercase">
                        Manage Class Schedules
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Create, edit, and manage all class schedules.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DownloadTemplateButton />
                    <button
                        onClick={() => setIsImporting(true)}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-[#002f73] border border-[#002f73] bg-white hover:bg-[#f0f4ff] transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round" className="inline-block">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Import Schedule
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round" className="inline-block">
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
                                        Loading schedules…
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-red-400">
                                        {fetchError}
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
                                    <tr key={s.entryKey} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                    style={{ backgroundColor: s.avatarColor }}
                                                >
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
                                                    onClick={() => handleDelete(s)}
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
                        <button onClick={() => setSchedulePage((p) => Math.max(1, p - 1))} disabled={schedulePage === 1}
                            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                            &lt;
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                            <button key={pg} onClick={() => setSchedulePage(pg)}
                                className={`w-7 h-7 text-xs font-semibold transition-colors ${
                                    pg === schedulePage ? "bg-[#002f73] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
                                }`}>
                                {pg}
                            </button>
                        ))}
                        <button onClick={() => setSchedulePage((p) => Math.min(totalPages, p + 1))} disabled={schedulePage === totalPages}
                            className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
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
                    onSaved={() => { fetchSchedules(); setIsAdding(false); }}
                />
            )}

            {/* Import Schedule Modal */}
            {isImporting && (
                <ImportScheduleModal
                    accessToken={accessToken}
                    onClose={() => setIsImporting(false)}
                    onImportComplete={() => { fetchSchedules(); setIsImporting(false); }}
                />
            )}

            {/* Edit Schedule Modal */}
            {isEditing && selectedSchedule && (
                <EditScheduleModal
                    schedule={selectedSchedule}
                    accessToken={accessToken}
                    onClose={() => { setIsEditing(false); setSelectedSchedule(null); }}
                    onSaved={() => {
                        fetchSchedules();
                        setIsEditing(false);
                        setSelectedSchedule(null);
                    }}
                    onDelete={(s: FacultySchedule) => {
                        handleDelete(s);
                    }}
                />
            )}

        </section>
    );
}