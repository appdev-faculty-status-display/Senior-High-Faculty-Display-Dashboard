// frontend/src/pages/admin/addFaculty.tsx
import { useState, useEffect } from "react";
import { getFacultyList } from "@/lib/facultyApi";
import type { FacultyRecord, ImportFacultyResult } from "@/lib/facultyApi";
import { MOCK_FACULTY } from "@/data/mockFaculty";
import ImportFacultyModal from "@/components/modal/ImportfacultyModal";
import EditFacultyModal from "@/components/modal/EditFacultyModal";
import type { FacultyTableRow } from "@/components/modal/EditFacultyModal";
import SelectFilter from "@/components/SelectFilter";
import StatusBadge from "@/components/StatusBadge";
import IconSearch from "@/components/icons/SearchIcon";
import IconEdit from "@/components/icons/EditIcon";
import IconTrash from "@/components/icons/TrashIcon";
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

// Convert faculty-states status (kebab-case) → StatusBadge format (uppercase with spaces)
const STATUS_MAP: Record<string, string> = {
  "available":      "AVAILABLE",
  "in-class":       "IN CLASS",
  "on-break":       "ON BREAK",
  "off-campus":     "OFF CAMPUS",
  "in-meeting":     "IN MEETING",
  "do-not-disturb": "DO NOT DISTURB",
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
    subjects:         f.subjects.length > 0 ? f.subjects.join(', ') : '—',
    consultationHours: consult
      ? `${consult.day} ${consult.startTime}–${consult.endTime}`
      : '—',
  };
}

function mockToTableRow(f: typeof MOCK_FACULTY[number]): FacultyTableRow {
  const consult = f.consultationHours;
  return {
    id:               f.id,
    name:             f.name,
    strand:           f.strand,
    role:             'faculty' as const,
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
  const [rows, setRows]                 = useState<FacultyTableRow[]>(MOCK_FACULTY.map(mockToTableRow));
  const [strandFilter, setStrandFilter] = useState("All Strands");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [isImporting, setIsImporting]   = useState(false);
  const [lastImport, setLastImport]     = useState<ImportFacultyResult | null>(null);
  const [editTarget, setEditTarget]     = useState<FacultyTableRow | null>(null);

  // ── Fetch from backend (replaces mock on success) ──────────────────────────
  useEffect(() => {
    getFacultyList()
      .then((res) => {
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
    if (result.status !== 'failed') {
      getFacultyList()
        .then((res: { data: FacultyRecord[] }) => { if (res.data.length > 0) setRows(res.data.map(toTableRow)); })
        .catch(() => {});
    }
  }

  function handleSave(updated: FacultyTableRow) {
    setRows((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  }

  function handleDelete(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="min-h-screen w-full bg-gray-50 p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#002f73] uppercase">
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
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
                {["Faculty Member", "Strand", "Role", "Status", "Location", "Subjects", "Consultation Hours", "Actions"].map((h) => (
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
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400 text-sm">
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

                    {/* Actions */}
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditTarget(f)}
                          className="p-1.5 hover:bg-blue-100 text-[#002f73] transition-colors"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 hover:bg-red-100 text-red-400 transition-colors"
                        >
                          <IconTrash />
                        </button>
                      </div>
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
                    ? "bg-[#002f73] text-white shadow-sm"
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
          onSuccess={(result) => {
            handleImportSuccess(result);
            setIsImporting(false);
          }}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditFacultyModal
          faculty={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(updated) => {
            handleSave(updated);
            setEditTarget(null);
          }}
          onDelete={(id) => {
            handleDelete(id);
            setEditTarget(null);
          }}
        />
      )}
    </section>
  );
}