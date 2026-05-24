// components/DownloadTemplateButton.tsx

import ExcelJS from "exceljs";
import { IMPORT_TIME_INSTRUCTIONS } from "@/utils/phTime";

const SAMPLE_ROWS = [
    { facultyId: 'FAC-001', name: 'Juan dela Cruz', day: 'Monday',    startTime: '07:30', endTime: '09:00', subject: 'General Mathematics',    room: 'Room 101' },
    { facultyId: 'FAC-001', name: 'Juan dela Cruz', day: 'Wednesday', startTime: '13:00', endTime: '14:30', subject: 'Pre-Calculus',            room: 'Room 102' },
    { facultyId: 'FAC-002', name: 'Maria Santos',   day: 'Tuesday',   startTime: '09:00', endTime: '10:30', subject: 'Earth and Life Science',  room: 'Room 203' },
];

export default function DownloadTemplateButton() {
    const handleDownload = async () => {
        const workbook = new ExcelJS.Workbook();

        // ── Sheet 1: Schedule Import ───────────────────────────────────────────
        const sheet = workbook.addWorksheet('Schedule Import');

        // Column definitions — width matches header order exactly
        sheet.columns = [
            { header: 'facultyId', key: 'facultyId', width: 14 },
            { header: 'name',      key: 'name',      width: 24 },
            { header: 'day',       key: 'day',        width: 12 },
            { header: 'startTime', key: 'startTime',  width: 12 },
            { header: 'endTime',   key: 'endTime',    width: 12 },
            { header: 'subject',   key: 'subject',    width: 28 },
            { header: 'room',      key: 'room',       width: 14 },
        ];

        // Bold header row
        sheet.getRow(1).font = { bold: true };

        // Sample rows
        SAMPLE_ROWS.forEach((row) => sheet.addRow(row));

        // ── Sheet 2: Instructions ─────────────────────────────────────────────
        const infoSheet = workbook.addWorksheet('Instructions');

        infoSheet.columns = [
            { header: 'Field',    key: 'Field',    width: 14 },
            { header: 'Format',   key: 'Format',   width: 14 },
            { header: 'Timezone', key: 'Timezone', width: 28 },
            { header: 'Example',  key: 'Example',  width: 12 },
            { header: 'Notes',    key: 'Notes',    width: 70 },
        ];

        infoSheet.getRow(1).font = { bold: true };

        IMPORT_TIME_INSTRUCTIONS.forEach((row) => infoSheet.addRow(row));

        // ── Trigger download ──────────────────────────────────────────────────
        const buffer = await workbook.xlsx.writeBuffer();
        const blob   = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'schedule_import_template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Template
        </button>
    );
}