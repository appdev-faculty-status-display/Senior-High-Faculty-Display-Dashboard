import { useState } from "react";
import type { CreateAnnouncementBody, AnnouncementScope } from "../../types/announcement";
import { strands } from "../../data/mockRequestForm";

interface Props {
    onClose: () => void;
    onSubmit: (draft: CreateAnnouncementBody) => void;
    error?: string | null;
}

export default function AddAnnouncementModal({ onClose, onSubmit, error }: Props) {
    const [message, setMessage] = useState("");
    const [scope, setScope] = useState<AnnouncementScope>("all");
    const [strand, setStrand] = useState("");
    const [expiresAt, setExpiresAt] = useState("");

    const handleSubmit = () => {
        if (!message.trim()) return;
        if (scope === "strand" && !strand.trim()) return;

        const draft: CreateAnnouncementBody = {
            message: message.trim(),
            scope,
            ...(scope === "strand" ? { strand: strand.trim() } : {}),
            ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        };

        onSubmit(draft);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white shadow-lg w-full max-w-md p-8 border border-gray-100">
                <h2
                    className="text-xl font-extrabold tracking-tight mb-1"
                    style={{ color: "#002f73" }}
                >
                    Add Announcement
                </h2>
                <div className="border-b-2 border-yellow-400 mb-6" />

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                            Scope
                        </label>
                        <select
                            value={scope}
                            onChange={(e) => setScope(e.target.value as AnnouncementScope)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400"
                        >
                            <option value="all">All</option>
                            <option value="strand">Strand</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-400">
                            {scope === "strand"
                                ? "Posting a new strand announcement replaces the active announcement for that strand."
                                : "Posting a new all-school announcement replaces the current active all-school announcement."}
                        </p>
                    </div>

                    {scope === "strand" && (
                        <div>
                            <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
                                Strand
                            </label>
                            <select
                                value={strand}
                                onChange={(e) => setStrand(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400"
                            >
                                <option value="">Select a strand</option>
                                {strands.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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
                            Expires At <span className="text-gray-400 normal-case font-normal">(optional)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Leave blank to keep the announcement active indefinitely.
                        </p>
                    </div>
                </div>

                <div className="border-b border-gray-100 mt-6 mb-6" />

                {error && (
                    <p className="text-xs text-red-500 mb-4">{error}</p>
                )}

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
                    >
                        Post Announcement
                    </button>
                </div>
            </div>
        </div>
    );
}