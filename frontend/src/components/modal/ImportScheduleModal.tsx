// ImportScheduleModal.tsx

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

// Props no longer pass FacultySchedule[] — the backend returns an import result summary,
// not schedule rows. onImportComplete replaces onImport.
interface ImportResult {
    importId: string;
    status: "success" | "partial" | "failed";
    recordsProcessed: number;
    recordsApplied: number;
    errors: { row: number; message: string }[];
}

interface Props {
    onClose: () => void;
    onImportComplete: (result: ImportResult) => void; 
    accessToken: string;                             
}

export default function ImportScheduleModal({ onClose, onImportComplete, accessToken }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local UI state
    const [replaceAll, setReplaceAll]   = useState(false);
    const [isLoading, setIsLoading]     = useState(false);
    const [error, setError]             = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // ── File selection validation (before upload) ──────────────────────────────
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // Must be .xlsx — backend multer rejects anything else
        if (!file.name.endsWith(".xlsx")) {
            setError("Only .xlsx files are accepted. Please use the template.");
            e.target.value = "";
            return;
        }

        // Backend multer limit is 5MB — keep label in sync
        if (file.size > 5 * 1024 * 1024) {
            setError("File exceeds the 5 MB limit.");
            e.target.value = "";
            return;
        }

        setSelectedFile(file);
    };

    // ── Actual API call ────────────────────────────────────────────────────────
    // Replaces the old FileReader / CSV parsing approach entirely.
    // Sends multipart/form-data so multer can receive req.file on the backend.
    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select an .xlsx file first.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);           
            formData.append("replaceAll", String(replaceAll)); 

            // Do NOT set Content-Type manually — browser sets the multipart boundary
            const res = await fetch("/api/schedule/import", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const data: ImportResult = await res.json();

            if (!res.ok) {
                // Surface validation / auth errors returned by the backend
                setError((data as any)?.message ?? "Import failed. Please try again.");
                return;
            }

            onImportComplete(data);
            onClose();
        } catch (err) {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white shadow-lg w-full max-w-md p-8 border border-gray-100">
                <h2
                    className="text-xl font-extrabold tracking-tight mb-1"
                    style={{ color: "#002f73" }}
                >
                    Import Schedules
                </h2>
                <div className="border-b-2 border-yellow-400 mb-6" />

                {/* Dropzone — now accepts .xlsx only */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-yellow-400 p-10 cursor-pointer hover:bg-yellow-50 transition-colors mb-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx"            
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <svg
                        className="w-12 h-12 mb-3"
                        style={{ color: "#002f73" }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a9 9 0 1118 0" />
                    </svg>
                    <span className="font-bold text-base" style={{ color: "#002f73" }}>
                        Drag &amp; drop your .xlsx file here
                    </span>
                    {/* File size label now matches the 5MB multer limit */}
                    <span className="text-sm text-gray-500 mt-1">or click to browse – max 5MB</span>

                    {/* Show selected filename once chosen */}
                    {selectedFile && (
                        <span className="text-xs text-green-600 mt-2 font-semibold">
                            {selectedFile.name}
                        </span>
                    )}
                </label>

                {/* Column hint now matches backend REQUIRED_COLUMNS exactly */}
                <p className="text-xs text-gray-400 mb-3">
                    Required columns: <span className="font-medium text-gray-500">facultyId, name, day, startTime, endTime, subject, room</span>
                    {" "}— times in HH:MM 24-hour PH time (e.g. 07:30, 13:00)
                </p>

                {/* replaceAll toggle — wires to req.body.replaceAll on the backend */}
                <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={replaceAll}
                        onChange={(e) => setReplaceAll(e.target.checked)}
                        className="accent-[#002f73] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-gray-600">
                        Replace all existing schedules for matched faculty
                    </span>
                </label>

                {/* Inline error display */}
                {error && (
                    <p className="text-xs text-red-500 font-semibold mb-4">{error}</p>
                )}

                <div className="border-b border-gray-100 mb-6" />

                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    {/* Calls the API instead of triggering the file picker */}
                    <button
                        onClick={handleUpload}
                        disabled={isLoading || !selectedFile}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Uploading…" : "Upload & Import"}
                    </button>
                </div>
            </div>
        </div>
    );
}