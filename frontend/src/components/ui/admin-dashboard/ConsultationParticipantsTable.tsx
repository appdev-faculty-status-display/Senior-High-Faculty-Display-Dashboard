// frontend/src/components/ui/admin-dashboard/ConsultationParticipantsTable.tsx
import { useState, useMemo } from "react";
import type { ConsultationParticipant } from "@/types/adminDashboard.types";

interface ConsultationParticipantsTableProps {
  participants: ConsultationParticipant[];
}

const STATUS_STYLE: Record<ConsultationParticipant["status"], string> = {
  Completed: "bg-[#e6f9ec] text-[#31ac52]",
  Cancelled: "bg-[#fde8e7] text-[#ed3a30]",
  "No-show": "bg-[#f5f5f5] text-[#4f4f4f]",
};

// ── CSV escape helper ─────────────────────────────────────────────────────────
// Wraps every cell in quotes and escapes embedded double-quotes by doubling them.
// Also strips newlines inside values to keep each record on one line.
function csvCell(value: string): string {
  const safe = value.replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${safe}"`;
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(data: ConsultationParticipant[]) {
  const headers = [
    "Student ID (Hashed)",
    "Faculty Name",
    "Reason",
    "Consultation Room Used",
    "Date",
    "Time",
    "Status",
  ].map(csvCell);

  const rows = data.map((p) =>
    [
      p.hashedStudentId,
      p.facultyName,
      p.reason,
      p.consultationUsed ? "Yes" : "No",
      p.date,
      p.time,
      p.status,
    ].map(csvCell)
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "consultation_participants.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Export PDF ────────────────────────────────────────────────────────────────
// Uses DOM APIs (text nodes) to avoid XSS from interpolated user data.
function exportPDF(data: ConsultationParticipant[]) {
  const win = window.open("", "_blank");
  if (!win) return;

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Consultation Participants</title>
  <style>
    body { font-family: Inter, sans-serif; font-size: 11px; color: #1a1a1a; padding: 32px; }
    h1   { font-size: 16px; font-weight: 800; color: #002f73; margin-bottom: 4px; }
    p    { font-size: 11px; color: #4f4f4f; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #002f73; color: white; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e8edf5; }
    tbody tr:nth-child(even) { background: #f8faff; }
  </style>
</head>
<body>
  <h1>Consultation Participants</h1>
  <p id="subtitle"></p>
  <table>
    <thead>
      <tr>
        <th>Student ID</th><th>Faculty</th><th>Reason</th>
        <th>Room Used</th><th>Date</th><th>Time</th><th>Status</th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
</body>
</html>`);
  doc.close();

  // Set subtitle safely via textContent (no XSS risk)
  const subtitle = doc.getElementById("subtitle");
  if (subtitle) {
    subtitle.textContent = `Exported on ${new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })} — Student names are hashed for privacy.`;
  }

  // Build table rows via DOM APIs — no string interpolation of user data
  const tbody = doc.getElementById("tbody");
  if (tbody) {
    data.forEach((p) => {
      const tr = doc.createElement("tr");
      const cells = [
        p.hashedStudentId,
        p.facultyName,
        p.reason,
        p.consultationUsed ? "Yes" : "No",
        p.date,
        p.time,
        p.status,
      ];
      cells.forEach((value) => {
        const td = doc.createElement("td");
        td.textContent = value; // textContent is XSS-safe
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  win.focus();
  win.print();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ConsultationParticipantsTable({
  participants,
}: ConsultationParticipantsTableProps) {
  const [searchFaculty,  setSearchFaculty]  = useState("");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterRoomUsed, setFilterRoomUsed] = useState("All");
  const [searchReason,   setSearchReason]   = useState("");

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      const facultyMatch = p.facultyName
        .toLowerCase()
        .includes(searchFaculty.toLowerCase());
      const statusMatch =
        filterStatus === "All" || p.status === filterStatus;
      const roomMatch =
        filterRoomUsed === "All" ||
        (filterRoomUsed === "Yes" ? p.consultationUsed : !p.consultationUsed);
      const reasonMatch = p.reason
        .toLowerCase()
        .includes(searchReason.toLowerCase());
      return facultyMatch && statusMatch && roomMatch && reasonMatch;
    });
  }, [participants, searchFaculty, filterStatus, filterRoomUsed, searchReason]);

  const hasFilters =
    searchFaculty || filterStatus !== "All" || filterRoomUsed !== "All" || searchReason;

  return (
    <div className="bg-white border border-[#cbd5e1] shadow-sm flex flex-col gap-4 font-[Inter,sans-serif]">
      {/* ── Header row ── */}
      <div className="px-5 pt-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-extrabold text-[#002f73] uppercase tracking-wide">
            Consultation Participants
          </h3>
          <p className="text-[11px] text-[#4f4f4f] mt-0.5">
            Student names are hashed for privacy. Showing {filtered.length} of {participants.length} records.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => exportPDF(filtered)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] hover:border-[#064db6] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Export PDF
          </button>
          {hasFilters && (
            <button
              onClick={() => {
                setSearchFaculty("");
                setFilterStatus("All");
                setFilterRoomUsed("All");
                setSearchReason("");
              }}
              className="text-[11px] font-bold text-[#ed3a30] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="px-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Faculty search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4f4f4f]" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchFaculty}
            onChange={(e) => setSearchFaculty(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#064db6]"
          />
        </div>

        {/* Reason search */}
        <input
          type="text"
          placeholder="Search reason..."
          value={searchReason}
          onChange={(e) => setSearchReason(e.target.value)}
          className="py-1.5 px-2.5 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#064db6]"
        />

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-show">No-show</option>
        </select>

        {/* Room used filter */}
        <select
          value={filterRoomUsed}
          onChange={(e) => setFilterRoomUsed(e.target.value)}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          <option value="All">Room Used: All</option>
          <option value="Yes">Room Used: Yes</option>
          <option value="No">Room Used: No</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="px-5 pb-5 overflow-x-auto">
        <div className="border border-[#e8edf5]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: "#002f73" }}>
                {["Student ID", "Faculty Name", "Reason", "Room Used", "Date", "Time", "Status"].map((h) => (
                  <th key={h} className="text-left text-white font-bold px-4 py-2.5 whitespace-nowrap tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#9ca3af] text-xs">
                    No consultation records match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#f0f4ff] last:border-0"
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#f8faff" }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[10px] bg-[#f0f4ff] text-[#064db6] px-2 py-0.5 font-bold tracking-wider">
                        {p.hashedStudentId}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[#1a1a1a] whitespace-nowrap">
                      {p.facultyName}
                    </td>
                    <td className="px-4 py-2.5 text-[#4f4f4f] max-w-[180px]">
                      <span className="line-clamp-2">{p.reason}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${p.consultationUsed ? "bg-[#e6f9ec] text-[#31ac52]" : "bg-[#f5f5f5] text-[#4f4f4f]"}`}>
                        {p.consultationUsed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#4f4f4f] whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-2.5 text-[#4f4f4f] whitespace-nowrap">{p.time}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${STATUS_STYLE[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}