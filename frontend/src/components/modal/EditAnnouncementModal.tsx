import { useState } from "react";
import type { Announcement } from "../../types/announcement";
import { Button } from "@/components/ui/button"; 

interface Props {
    announcement: Announcement;
    onClose: () => void;
    onSave: (updated: Announcement) => void;
    onDelete: (id: number) => void;
    }

function formatDateTime(isoString: string): string {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    return date
        .toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        })
        .replace(",", "") // remove comma after day
        .replace("AM", "am")
        .replace("PM", "pm");
    }

export default function EditAnnouncementModal({
    announcement,
    onClose,
    onSave,
    onDelete,
    }: Props) {
    const [title, setTitle] = useState(announcement.title);
    const [message, setMessage] = useState(announcement.message);
    const [date, setDate] = useState(() => {
        if (!announcement.datePosted) return "";
        const parsed = new Date(announcement.datePosted);
        return isNaN(parsed.getTime())
        ? ""
        : parsed.toISOString().split("T")[0]; // safe YYYY-MM-DD for <input type="date">
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white shadow-lg w-full max-w-md p-8 border border-gray-100">
            <h2
            className="text-xl font-extrabold tracking-tight mb-1"
            style={{ color: "#002f73" }}
            >
            Edit Announcement
            </h2>
            <div className="border-b-2 border-yellow-400 mb-6" />

            <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                Title
                </label>
                <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400"
                />
            </div>

            <div>
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                Message
                </label>
                <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400 resize-none"
                />
            </div>

            <div>
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                Date
                </label>
                <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400"
                />
                {/* 👇 Preview formatted date */}
                <p className="text-xs text-gray-500 mt-1">
                {date ? formatDateTime(new Date(date).toISOString()) : ""}
                </p>
            </div>
            </div>

            <div className="border-b border-gray-100 mt-6 mb-6" />

            <div className="flex items-center justify-end gap-3">
            <Button variant="active"
                onClick={() => {
                onDelete(announcement.id);
                onClose();
                }}
            >
                Delete
            </Button>
            <Button variant="active"
                onClick={onClose}
            >
                Cancel
            </Button>
            <Button variant="active"
                onClick={() => {
                const isoDate = date ? new Date(date).toISOString() : "";
                onSave({ ...announcement, title, message, datePosted: isoDate });
                onClose();
                }}
            >
                Save Changes
            </Button>
            </div>
        </div>
        </div>
    );
}
