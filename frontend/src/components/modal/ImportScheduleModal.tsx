import type { FacultySchedule } from "../../types/schedule";

interface Props {
    onClose: () => void;
    onImport: (schedules: FacultySchedule[]) => void;
    }

    export default function ImportScheduleModal({ onClose, onImport }: Props) {
    const handleFileUpload = (file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
        const text = e.target?.result as string;

        // Split CSV into rows
        const rows = text.trim().split("\n").map((row) => row.split(","));

        // Map rows into FacultySchedule objects
        const parsed: FacultySchedule[] = rows.slice(1).map((cols, index) => {
            return {
            id: index + 1,
            name: cols[0]?.trim() || "",
            subject: cols[1]?.trim() || "",
            strand: cols[2]?.trim() || "",
            day: cols[3]?.trim() || "",
            time: `${cols[4]?.trim() || ""} – ${cols[5]?.trim() || ""}`,
            room: cols[6]?.trim() || "",
            status: "AVAILABLE", // default value
            } as FacultySchedule; // 👈 force TypeScript to treat it as FacultySchedule
        });

        onImport(parsed);
        onClose();
        };

        reader.readAsText(file);
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

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-yellow-400 p-10 cursor-pointer hover:bg-yellow-50 transition-colors mb-3">
            <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                }}
            />
            <svg
                className="w-12 h-12 mb-3"
                style={{ color: "#002f73" }}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
            >
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0l-4 4m4-4l4 4"
                />
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
                />
                <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 15a9 9 0 1118 0"
                />
            </svg>
            <span className="font-bold text-base" style={{ color: "#002f73" }}>
                Drag &amp; drop your CSV file here
            </span>
            <span className="text-sm text-gray-500 mt-1">
                or click to browse – max 10MB
            </span>
            </label>

            <p className="text-xs text-gray-400 mb-6">
            Required columns: teacher, subject, section, days, start_time,
            end_time, room
            </p>

            <div className="border-b border-gray-100 mb-6" />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
            <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold border border-gray-300 text-gray-600"
            >
                Cancel
            </button>
            <button
                onClick={() => {
                // Trigger file input click manually
                document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
                }}
                className="px-5 py-2 text-sm font-semibold border border-gray-300 text-gray-600"
            >
                Upload & Import
            </button>
            </div>
        </div>
        </div>
    );
}
