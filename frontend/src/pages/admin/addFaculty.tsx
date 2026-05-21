// frontend/src/pages/admin/addFaculty.tsx
import { useState, useEffect } from "react";
import { getFacultyList } from "@/lib/facultyApi";
import type { FacultyListResponse, FacultyRecord, ImportFacultyResult } from "@/lib/facultyApi";
import type { FacultyStatus, Strands } from "@/types/faculty-states";
import { MOCK_FACULTY } from "@/data/mockFaculty";
import ImportFacultyModal from "@/components/modal/ImportfacultyModal";
import SelectFilter from "@/components/SelectFilter";
import StatusBadge from "@/components/StatusBadge";
import IconSearch from "@/components/icons/SearchIcon";
import IconPlus from "@/components/icons/PlusIcon";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Constants ─────────────────────────────────────────────────────────────────

const STRANDS = ["All Strands", "STEM", "ABM", "HUMSS"];
const ROWS_PER_PAGE = 10;

// Convert faculty-states status (kebab-case) → uppercase with spaces for StatusBadge
const STATUS_MAP: Record<string, string> = {
  "available":       "AVAILABLE",
  "in-class":        "IN CLASS",
  "on-break":        "ON BREAK",
  "off-campus":      "OFF CAMPUS",
  "in-meeting":      "IN MEETING",
  "do-not-disturb":  "DO NOT DISTURB",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type FacultyTableRow = {
  id: string;
  name: string;
  strand: Strands;
  role: string;
  status: FacultyStatus;
  location: string;
  subjects: string;
  consultationHours: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toTableRow(f: FacultyRecord): FacultyTableRow {
  const consult = f.consultationHours[0];
  return {
    id:               f.id,
    name:             f.name,
    strand:           f.strand,
    role:             f.role,
    status:           f.currentStatus,
    location:         f.currentRoom,
    subjects:         f.subjects.join(', '),
    consultationHours: consult
      ? `${consult.day} ${consult.startTime}–${consult.endTime}`
      : '—',
  };
}

// Convert mockFaculty shape to table row shape (used as fallback)
function mockToTableRow(f: typeof MOCK_FACULTY[number]): FacultyTableRow {
  const consult = f.consultationHours;
  return {
    id:               f.id,
    name:             f.name,
    strand:           f.strand,
    role:             'faculty',
    status:           f.status,
    location:         f.currentLocation,
    subjects:         f.subject ?? '—',
    consultationHours: consult
      ? `${consult.start}–${consult.end}`
      : '—',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddFaculty() {
  const [rows, setRows]               = useState<FacultyTableRow[]>(MOCK_FACULTY.map(mockToTableRow));
  const [strandFilter, setStrandFilter] = useState("All Strands");
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [lastImport, setLastImport]   = useState<ImportFacultyResult | null>(null);

  // ── Fetch from backend (replaces mock on success) ──────────────────────────
  useEffect(() => {
    getFacultyList()
      .then((res: FacultyListResponse) => {
        if (res.data.length > 0) {
          setRows(res.data.map(toTableRow));
        }
      })
      .catch(() => {
        // Backend unreachable — keep mock data silently
      });
  }, []);


  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const matchStrand = strandFilter === "All Strands" || r.strand === strandFilter;
    const matchSearch =
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.subjects.toLowerCase().includes(search.toLowerCase());
    return matchStrand && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string) => { setter(value); setPage(1); };
  }

  function handleImportSuccess(result: ImportFacultyResult) {
    setLastImport(result);
    // Refresh list from backend after successful import
    if (result.status !== 'failed') {
      getFacultyList()
        .then((res: FacultyListResponse) => { if (res.data.length > 0) setRows(res.data.map(toTableRow)); })
        .catch(() => {});
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="min-h-screen w-full bg-gray-50 p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#002f73]">
            Manage Faculty
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            View and import faculty members for the SHS Faculty Board.
          </p>
        </div>
        <button
          onClick={() => setIsImporting(true)}
          className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] transition-colors"
        >
          <IconPlus />
          Import Faculty
        </button>
      </div>

      {/* Last import summary banner */}
      {lastImport && (
        <div
          className="mb-4 px-4 py-2.5 border text-xs font-semibold flex items-center justify-between"
          style={{
            background: lastImport.status === 'failed' ? '#fde8e7' : '#e6f9ec',
            borderColor: lastImport.status === 'failed' ? '#ed3a30' : '#31ac52',
            color: lastImport.status === 'failed' ? '#ed3a30' : '#31ac52',
          }}
        >
          <span>
            Last import: {lastImport.recordsCreated} created, {lastImport.recordsUpdated} updated
            {lastImport.errors.length > 0 && `, ${lastImport.errors.length} error(s)`}
          </span>
          <button
            onClick={() => setLastImport(null)}
            className="ml-4 font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
          <SelectFilter
            value={strandFilter}
            onChange={handleFilterChange(setStrandFilter)}
            options={STRANDS}
          />
          <div className="flex items-center border border-gray-200 px-3 py-2 bg-white flex-1 min-w-40 gap-2">
            <IconSearch />
            <input
              type="text"
              placeholder="Search faculty or subject..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* shadcn Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                {["Faculty Name", "Strand", "Role", "Status", "Location", "Subjects", "Consultation Hours"].map((h) => (
                  <TableHead
                    key={h}
                    className="text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap py-3 px-4"
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
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                    No faculty found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((f, i) => (
                  <TableRow
                    key={f.id}
                    className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors"
                    style={{ background: i % 2 === 0 ? '#ffffff' : '#f8faff' }}
                  >
                    {/* Name */}
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "#002f73" }}
                        >
                          {f.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-semibold text-[#1a1a1a] text-sm whitespace-nowrap">
                          {f.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Strand */}
                    <TableCell className="px-4 py-3 font-semibold text-[#002f73] text-sm">
                      {f.strand}
                    </TableCell>

                    {/* Role */}
                    <TableCell className="px-4 py-3 text-gray-600 text-sm capitalize">
                      {f.role.replace('_', ' ')}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={STATUS_MAP[f.status] ?? f.status} />
                    </TableCell>

                    {/* Location */}
                    <TableCell className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">
                      {f.location}
                    </TableCell>

                    {/* Subjects */}
                    <TableCell className="px-4 py-3 text-gray-600 text-sm max-w-[180px] truncate">
                      {f.subjects}
                    </TableCell>

                    {/* Consultation hours */}
                    <TableCell className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">
                      {f.consultationHours}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>
            Showing{" "}
            {filtered.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1} to{" "}
            {Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`w-7 h-7 text-xs font-semibold transition-colors ${
                  pg === page
                    ? "bg-yellow-400 text-white shadow-sm"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Import modal */}
      {isImporting && (
        <ImportFacultyModal
          onClose={() => setIsImporting(false)}
          onSuccess={(result: ImportFacultyResult) => {
            handleImportSuccess(result);
            setIsImporting(false);
          }}
        />
      )}
    </section>
  );
}