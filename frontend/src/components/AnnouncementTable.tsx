import { useState } from "react";
import type { Announcement } from "../types/announcement";
import EditIcon from "./icons/EditIcon";
import TrashIcon from "./icons/TrashIcon";
import AddAnnouncementModal from "./modal/AddAnnouncementModal";
import EditAnnouncementModal from "./modal/EditAnnouncementModal";
import { formatDateTime } from "@/lib/utils";

interface Props {
    announcements: Announcement[];
    onDelete: (id: number) => void;
    onAdd: (announcement: Omit<Announcement, "id">) => void;
    onEdit: (updated: Announcement) => void;
    }

    export default function AnnouncementTable({ announcements, onDelete, onAdd, onEdit }: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [editTarget, setEditTarget] = useState<Announcement | null>(null);

    return (
        <section className="p-6">
        {showAdd && (
            <AddAnnouncementModal
            onClose={() => setShowAdd(false)}
            onSubmit={onAdd}
            />
        )}
        {editTarget && (
            <EditAnnouncementModal
            announcement={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={onEdit}
            onDelete={onDelete}
            />
        )}

        <div className="flex items-start justify-between mb-5">
            <div>
            <h2 className="text-2xl font-extrabold tracking-tight uppercase" style={{ color: "#002f73" }}>
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
                    <th className="text-left px-5 py-3">Title</th>
                    <th className="text-left px-5 py-3">Message</th>
                    <th className="text-left px-5 py-3 whitespace-nowrap">Date Posted</th>
                    <th className="text-left px-5 py-3">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {announcements.length === 0 ? (
                    <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">
                        No announcements.
                    </td>
                    </tr>
                ) : (
                    announcements.map((a) => (
                    <tr key={a.id} className="hover:bg-yellow-50/40 transition-colors">
                        <td className="px-5 py-4 font-semibold whitespace-nowrap" style={{ color: "#002f73" }}>
                        {a.title}
                        </td>
                        <td className="px-5 py-4 text-gray-600 max-w-xs">{a.message}</td>
                        <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-xs">
                        {formatDateTime(a.datePosted)}
                        </td>
                        <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                            <button
                            onClick={() => setEditTarget(a)}
                            className="p-1.5 hover:bg-blue-100 transition-colors"
                            style={{ color: "#002f73" }}
                            >
                            <EditIcon />
                            </button>
                            <button
                            onClick={() => onDelete(a.id)}
                            className="p-1.5 hover:bg-red-100 text-red-400 transition-colors"
                            >
                            <TrashIcon />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>
        </section>
    );
}