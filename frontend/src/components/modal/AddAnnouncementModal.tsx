import { useState } from "react";
import type { Announcement } from "../../types/announcement";
import { Button } from "@/components/ui/button"; 

    interface Props {
    onClose: () => void;
    onSubmit: (announcement: Omit<Announcement, "id">) => void;
    }

export default function AddAnnouncementModal({ onClose, onSubmit }: Props) {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [date, setDate] = useState("");

    const handleSubmit = () => {
        if (!title.trim() || !message.trim()) return;
        onSubmit({
        title,
        message,
        datePosted: date
            ? new Date(date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            })
            : new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            }) +
            " – " +
            new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white shadow-lg w-full max-w-md p-8 border border-gray-100">
            <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
            Add Announcement
            </h2>
            <div className="border-b-2 border-yellow-400 mb-6" />

            <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                Title
                </label>
                <input
                type="text"
                placeholder="e.g. No classes on Tuesday"
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
                placeholder="Write your announcement here..."
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
            </div>
            </div>

            <div className="border-b border-gray-100 mt-6 mb-6" />

            <div className="flex items-center justify-end gap-3">
            <Button variant="active" onClick={onClose}>
                Cancel
            </Button>

            <Button variant="active" onClick={handleSubmit}>
                Post Announcement
            </Button>
            </div>
        </div>
        </div>
    );
}