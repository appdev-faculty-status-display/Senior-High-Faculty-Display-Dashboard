import { useRef } from "react";
import type { FacultySchedule, Strand, Day, Status } from "../../types/schedule";
import { Button } from "@/components/ui/button"; 

    interface Props {
    onClose: () => void;
    onImport: (schedules: FacultySchedule[]) => void;
    }

    const validStrands: Strand[] = ["STEM", "ABM", "HUMSS"];
    const validDays: Day[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const validStatuses: Status[] = [
    "AVAILABLE",
    "IN CLASS",
    "OFF CAMPUS",
    "DO NOT DISTURB",
    "IN MEETING",
    "ON BREAK",
    ];

    function parseStrand(value: string): Strand {
    return validStrands.includes(value as Strand) ? (value as Strand) : "STEM";
    }
    function parseDay(value: string): Day {
    return validDays.includes(value as Day) ? (value as Day) : "Monday";
    }
    function parseStatus(value: string): Status {
    return validStatuses.includes(value as Status) ? (value as Status) : "AVAILABLE";
    }

    function getAvatarInitials(name: string): string {
    return name
        .split(" ")
        .map((part) => part[0]?.toUpperCase())
        .join("")
        .slice(0, 2);
    }

    function getAvatarColor(name: string): string {
    const colors = ["#0A3D91", "#002f73", "#FF5733", "#28A745"];
    return colors[name.length % colors.length];
    }

    export default function ImportScheduleModal({ onClose, onImport }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.trim().split("\n").map((row) => row.split(","));

        const parsed: FacultySchedule[] = rows.slice(1).map((cols, index) => {
            const name = cols[0]?.trim() || "";
            return {
            id: index + 1,
            name,
            subject: cols[1]?.trim() || "",
            strand: parseStrand(cols[2]?.trim() || ""),
            day: parseDay(cols[3]?.trim() || ""),
            time: `${cols[4]?.trim() || ""} – ${cols[5]?.trim() || ""}`,
            room: cols[6]?.trim() || "",
            status: parseStatus(cols[7]?.trim() || "AVAILABLE"),
            avatarInitials: getAvatarInitials(name),
            avatarColor: getAvatarColor(name),
            };
        });

        onImport(parsed);
        onClose();
        };

        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white shadow-lg w-full max-w-md p-8 border border-gray-100">
            <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
            Import Schedules
            </h2>
            <div className="border-b-2 border-yellow-400 mb-6" />

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-yellow-400 p-10 cursor-pointer hover:bg-yellow-50 transition-colors mb-3">
            <input
                ref={fileInputRef}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a9 9 0 1118 0" />
            </svg>
            <span className="font-bold text-base" style={{ color: "#002f73" }}>
                Drag &amp; drop your CSV file here
            </span>
            <span className="text-sm text-gray-500 mt-1">or click to browse – max 10MB</span>
            </label>

            <p className="text-xs text-gray-400 mb-6">
            Required columns: teacher, subject, strand, day, start_time, end_time, room
            </p>

            <div className="border-b border-gray-100 mb-6" />

            <div className="flex items-center justify-end gap-3">
            <Button variant="active"
            onClick={onClose}
            >
            Cancel
            </Button>

            <Button variant="active"
            onClick={() => fileInputRef.current?.click()}
            >
            Upload & Import
            </Button>
            </div>
        </div>
        </div>
    );
}
