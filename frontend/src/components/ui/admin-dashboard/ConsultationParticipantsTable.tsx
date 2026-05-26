// frontend/src/components/ui/admin-dashboard/ConsultationParticipantsTable.tsx
import { useState, useMemo } from "react";
import type { ConsultationParticipant } from "@/types/adminDashboard.types";
import { downloadCSV } from "@/utils/csvEscapeHelper";
import { exportTablePDF } from "@/utils/pdfExportHelper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ConsultationParticipantsTableProps {
  participants: ConsultationParticipant[];
  globalFaculty?: string;
  globalDateFrom?: string;
  globalDateTo?: string;
}

const STATUS_STYLE: Record<ConsultationParticipant["status"], string> = {
  Completed: "bg-[#e6f9ec] text-[#31ac52]",
  Cancelled: "bg-[#fde8e7] text-[#ed3a30]",
  "No-show": "bg-[#f5f5f5] text-[#4f4f4f]",
};

const ROWS_PER_PAGE = 6;

const PDF_COLUMNS = [
  "Student ID", "Faculty Name", "Strand", "Room Used", "Date", "Time", "Status",
];

const TABLE_HEADERS = ["Student ID", "Faculty Name", "Strand", "Room Used", "Date", "Time", "Status"];

export default function ConsultationParticipantsTable({
  participants,
  globalFaculty  = "",
  globalDateFrom = "",
  globalDateTo   = "",
}: ConsultationParticipantsTableProps) {

  const [searchFaculty, setSearchFaculty] = useState("");
  const [filterStrand,  setFilterStrand]  = useState("All");
  const [filterStatus,  setFilterStatus]  = useState("All");
  const [page,          setPage]          = useState(1);

  const allStrands = useMemo(
    () => ["All", ...Array.from(new Set(participants.map((p) => p.strand)))],
    [participants]
  );

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      const globalFacultyMatch = globalFaculty
        ? p.facultyName.toLowerCase().includes(globalFaculty.toLowerCase())
        : true;
      const participantDate = new Date(p.date);
      const fromDate = globalDateFrom ? new Date(globalDateFrom) : null;
      const toDate = globalDateTo ? new Date(globalDateTo) : null;
      const dateMatch =
        (!fromDate || participantDate >= fromDate) &&
        (!toDate   || participantDate <= toDate);

      const localFacultyMatch = searchFaculty
        ? p.facultyName.toLowerCase().includes(searchFaculty.toLowerCase())
        : true;
      const strandMatch = filterStrand === "All" || p.strand === filterStrand;
      const statusMatch = filterStatus === "All" || p.status === filterStatus;

      return globalFacultyMatch && dateMatch && localFacultyMatch && strandMatch && statusMatch;
    });
  }, [participants, globalFaculty, globalDateFrom, globalDateTo, searchFaculty, filterStrand, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const hasLocalFilters = searchFaculty || filterStrand !== "All" || filterStatus !== "All";

  function clearLocalFilters() {
    setSearchFaculty("");
    setFilterStrand("All");
    setFilterStatus("All");
    setPage(1);
  }

  function handleExportCSV() {
    const headers = ["Student ID (Hashed)", "Faculty Name", "Strand", "Room Used", "Date", "Time", "Status"];
    const rows = filtered.map((p) => [
      p.hashedStudentId,
      p.facultyName,
      p.strand,
      p.consultationUsed ? "Yes" : "No",
      p.date,
      p.time,
      p.status,
    ]);
    downloadCSV([headers, ...rows], "consultation_participants");
  }

  function handleExportPDF() {
    const rows = filtered.map((p) => [
      p.hashedStudentId,
      p.facultyName,
      p.strand,
      p.consultationUsed ? "Yes" : "No",
      p.date,
      p.time,
      p.status,
    ]);
    exportTablePDF(
      PDF_COLUMNS,
      rows,
      "Consultation Participants",
      `Exported on ${new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })} — Student names are hashed for privacy.`
    );
  }

  return (
    <div className="bg-white border border-[#cbd5e1] shadow-sm flex flex-col gap-4 font-sans">

      {/* Header */}
      <div className="px-5 pt-5 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-extrabold text-[#002f73] uppercase tracking-wide">
            Consultation Participants
          </h3>
          <p className="text-[11px] text-[#4f4f4f] mt-0.5">
            Student names are hashed for privacy. Showing {filtered.length} of {participants.length} records.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Export PDF
          </button>
          {hasLocalFilters && (
            <button
              onClick={clearLocalFilters}
              className="text-[11px] font-bold text-[#ed3a30] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Local Filters */}
      <div className="px-5 grid grid-cols-3 gap-2">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4f4f4f]"
            width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchFaculty}
            onChange={(e) => { setSearchFaculty(e.target.value); setPage(1); }}
            className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#064db6]"
          />
        </div>
        <select
          value={filterStrand}
          onChange={(e) => { setFilterStrand(e.target.value); setPage(1); }}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          {allStrands.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Strands" : s}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-show">No-show</option>
        </select>
      </div>

      {/* shadcn Table */}
      <div className="px-5 overflow-x-auto">
        <div className="border border-[#e8edf5]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                {TABLE_HEADERS.map((h) => (
                  <TableHead
                    key={h}
                    className="text-white font-bold text-xs whitespace-nowrap tracking-wide py-2.5 uppercase"
                    style={{ background: "#002f73" }}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#9ca3af] text-xs">
                    No consultation records match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p, i) => (
                  <TableRow
                    key={p.id}
                    className="border-b border-[#f0f4ff] last:border-0 hover:bg-[#f0f4ff]/60"
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#f8faff" }}
                  >
                    <TableCell className="px-4 py-2.5">
                      <span className="font-mono text-[10px] bg-[#f0f4ff] text-[#064db6] px-2 py-0.5 font-bold tracking-wider">
                        {p.hashedStudentId}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-semibold text-[#1a1a1a] text-xs whitespace-nowrap">
                      {p.facultyName}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 font-semibold text-[#002f73] text-xs">
                      {p.strand}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${
                        p.consultationUsed
                          ? "bg-[#e6f9ec] text-[#31ac52]"
                          : "bg-[#f5f5f5] text-[#4f4f4f]"
                      }`}>
                        {p.consultationUsed ? "Yes" : "No"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-[#4f4f4f] text-xs whitespace-nowrap">
                      {p.date}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-[#4f4f4f] text-xs whitespace-nowrap">
                      {p.time}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 uppercase ${STATUS_STYLE[p.status]}`}>
                        {p.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="px-5 pb-5 flex items-center justify-between text-[11px] text-[#4f4f4f]">
        <span>Page {page} of {totalPages}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 border border-[#cbd5e1] hover:bg-[#f0f4ff] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => setPage(pg)}
              className={`w-6 h-6 text-[11px] font-semibold transition-colors ${
                pg === page
                  ? "bg-[#002f73] text-white"
                  : "border border-[#cbd5e1] hover:bg-[#f0f4ff] text-[#4f4f4f]"
              }`}
            >
              {pg}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 border border-[#cbd5e1] hover:bg-[#f0f4ff] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &gt;
          </button>
        </div>
      </div>

    </div>
  );
}