import * as XLSX from 'xlsx';

/**
 * Column names must exactly match backend REQUIRED_COLUMNS:
 * ['facultyId', 'name 'day', 'startTime', 'endTime', 'subject', 'room']
 *
 * Times must be in HH:MM 24-hour format, PH local time (Asia/Manila, UTC+8).
 * Example: 07:30 means 7:30 AM Philippine Standard Time.
 */
const TEMPLATE_HEADERS = ['facultyId', 'name', 'day', 'startTime', 'endTime', 'subject', 'room'];

const SAMPLE_ROWS = [
  {
    facultyId: 'FAC-001',
    name: 'Juan Dela Cruz',
    day: 'Monday',
    startTime: '07:30',   // PH local time, 24-hour
    endTime: '09:00',
    subject: 'General Mathematics',
    room: 'Room 101',
  },
  {
    facultyId: 'FAC-001',
    name: 'Juan Dela Cruz',
    day: 'Wednesday',
    startTime: '13:00',
    endTime: '14:30',
    subject: 'Pre-Calculus',
    room: 'Room 102',
  },
  {
    facultyId: 'FAC-002',
    name: 'Maria Santos',
    day: 'Tuesday',
    startTime: '09:00',
    endTime: '10:30',
    subject: 'Earth and Life Science',
    room: 'Room 103',
  },
];

export default function DownloadTemplateButton() {
  const handleDownload = () => {
    // Build worksheet from sample rows (guarantees column order)
    const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS, { header: TEMPLATE_HEADERS });

    // Style the header row (col widths for readability)
    ws['!cols'] = [
      { wch: 14 }, // facultyId
      { wch: 20 }, // name
      { wch: 12 }, // day
      { wch: 12 }, // startTime
      { wch: 12 }, // endTime
      { wch: 28 }, // subject
      { wch: 14 }, // room
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule Import');

    // Add a second "Instructions" sheet
    const instructions = [
      { Field: 'facultyId',  Rules: 'Required. Must match an existing faculty ID in the system.' },
      { Field: 'name', Rules: 'Required. Full name of the faculty member. If it differs from the name already on record, the record will be updated.' },
      { Field: 'day',        Rules: 'Required. One of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday' },
      { Field: 'startTime',  Rules: 'Required. HH:MM in 24-hour format, Philippine Standard Time (UTC+8). E.g. 07:30, 13:00' },
      { Field: 'endTime',    Rules: 'Required. HH:MM in 24-hour format, PST. Must be after startTime.' },
      { Field: 'subject',    Rules: 'Required. Subject name (free text).' },
      { Field: 'room',       Rules: 'Required. Room identifier (free text).' },
    ];
    const wsInfo = XLSX.utils.json_to_sheet(instructions);
    wsInfo['!cols'] = [{ wch: 14 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Instructions');

    XLSX.writeFile(wb, 'schedule_import_template.xlsx');
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-[#002f73] border border-gray-300 bg-white hover:border-[#97b7e6] transition-colors"
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