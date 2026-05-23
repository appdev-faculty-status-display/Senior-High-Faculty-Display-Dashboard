// AnnouncementTable.tsx
import { useState } from "react";
import type { Announcement, CreateAnnouncementBody } from "../types/announcement";
import TrashIcon from "./icons/TrashIcon";
import AddAnnouncementModal from "./modal/AddAnnouncementModal";
import { formatDateTime } from "@/lib/utils";

interface Props {
    announcements: Announcement[];
    total: number;
    page: number;
    loading: boolean;
    onDelete: (id: string) => void;
    onAdd: (draft: CreateAnnouncementBody) => void;
    onPageChange: (page: number) => void;
}

export default function AnnouncementTable({
    announcements,
    total,
    page,
    loading,
    onDelete,
    onAdd,
    onPageChange,
}: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const handleDeleteConfirm = () => {
        if (pendingDeleteId) {
            onDelete(pendingDeleteId);
            setPendingDeleteId(null);
        }
    };

    return (
        <section className="p-6">
            {showAdd && (
                <AddAnnouncementModal
                    onClose={() => setShowAdd(false)}
                    onSubmit={(draft) => {
                        onAdd(draft);
                        setShowAdd(false);
                    }}
                />
            )}

             {pendingDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white shadow-lg w-full max-w-sm p-8 border border-gray-100">
                        <h2
                            className="text-xl font-extrabold tracking-tight mb-1"
                            style={{ color: "#002f73" }}
                        >
                            Delete Announcement
                        </h2>
                        <div className="border-b-2 border-yellow-400 mb-6" />
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete this announcement? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setPendingDeleteId(null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white border border-red-600 bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between mb-5">
                <div>
                    <h2
                        className="text-2xl font-extrabold tracking-tight uppercase"
                        style={{ color: "#002f73" }}
                    >
                        Announcements
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Latest updates from the faculty and administration.
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] transition-colors"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="inline-block"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Announcement
                </button>
            </div>

            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#002f73] text-white text-xs font-bold uppercase tracking-wider">
                                <th className="text-left px-5 py-3">Scope</th>
                                <th className="text-left px-5 py-3">Message</th>
                                <th className="text-left px-5 py-3 whitespace-nowrap">Date Posted</th>
                                <th className="text-left px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-400">
                                        Loading…
                                    </td>
                                </tr>
                            ) : announcements.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-400">
                                        No announcements.
                                    </td>
                                </tr>
                            ) : (
                                announcements.map((a) => (
                                    <tr key={a.id} className="hover:bg-yellow-50/40 transition-colors">
                                        <td
                                            className="px-5 py-4 font-semibold whitespace-nowrap capitalize"
                                            style={{ color: "#002f73" }}
                                        >
                                            {a.scope === "strand" ? (
                                                <span>
                                                    Strand
                                                    {a.strand && (
                                                        <span className="ml-1 text-xs font-normal">
                                                            ({a.strand})
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                "All"
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600 max-w-xs">
                                            {a.message}
                                        </td>
                                        <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-xs">
                                            {formatDateTime(a.createdAt)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => setPendingDeleteId(a.id)}
                                                className="p-1.5 hover:bg-red-100 text-red-400 transition-colors"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {total > 0 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
                        <span>{total} announcement{total !== 1 ? "s" : ""}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onPageChange(page - 1)}
                                disabled={page <= 1}
                                className="px-3 py-1 border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1">Page {page}</span>
                            <button
                                onClick={() => onPageChange(page + 1)}
                                disabled={announcements.length < 20}
                                className="px-3 py-1 border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}