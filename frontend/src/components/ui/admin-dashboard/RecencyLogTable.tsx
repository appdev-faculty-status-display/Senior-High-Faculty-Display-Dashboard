// frontend/src/components/ui/admin-dashboard/RecencyLogTable.tsx
import { useState, useMemo } from "react";
import type { RecencyLogEntry, RecencyLogTableProps } from "@/types/adminDashboard.types";
import { timeToMinutes, inputToMinutes } from "@/utils/timeUtils";

export type { RecencyLogEntry };

const STATUS_COLORS: Record<string, string> = {
  "In Meeting":     "#9440dd",
  "In Class":       "#b8a000",
  "On Break":       "#3b74fa",
  "Available":      "#31ac52",
  "Do Not Disturb": "#ed3a30",
  "Off Campus":     "#ff914d",
};

const ROWS_PER_PAGE = 5;

interface RecencyLogTablePropsExtended extends RecencyLogTableProps {
  globalTimeFrom?: string;
  globalTimeTo?: string;
}

export default function RecencyLogTable({
  entries,
  globalTimeFrom = "",
  globalTimeTo   = "",
}: RecencyLogTablePropsExtended) {

  // ── Local filters: faculty search, strand, status ──
  const [searchName,   setSearchName]   = useState("");
  const [filterStrand, setFilterStrand] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [page,         setPage]         = useState(1);

  const allStrands = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.strand)))],
    [entries]
  );

  const allStatuses = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.currentStatus)))],
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const nameMatch   = entry.facultyName.toLowerCase().includes(searchName.toLowerCase());
      const strandMatch = filterStrand === "All" || entry.strand === filterStrand;
      const statusMatch = filterStatus === "All" || entry.currentStatus === filterStatus;

      // Time range from global filter
      const entryMin = timeToMinutes(entry.lastUpdated);
      const fromMin  = globalTimeFrom ? inputToMinutes(globalTimeFrom) : null;
      const toMin    = globalTimeTo   ? inputToMinutes(globalTimeTo)   : null;
      const timeMatch =
        (fromMin === null || entryMin >= fromMin) &&
        (toMin   === null || entryMin <= toMin);

      return nameMatch && strandMatch && statusMatch && timeMatch;
    });
  }, [entries, searchName, filterStrand, filterStatus, globalTimeFrom, globalTimeTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const hasLocalFilters = searchName || filterStrand !== "All" || filterStatus !== "All";

  function clearLocalFilters() {
    setSearchName("");
    setFilterStrand("All");
    setFilterStatus("All");
    setPage(1);
  }

  return (
    <div className="bg-white border border-[#cbd5e1] shadow-sm flex flex-col gap-4 h-full font-[Inter,sans-serif]">

      {/* ── Header ── */}
      <div className="px-5 pt-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#002f73] uppercase tracking-wide">
            Last-Updated Recency Log
          </h3>
          <p className="text-[11px] text-[#4f4f4f] mt-0.5">
            Showing {filtered.length} of {entries.length} entries
          </p>
        </div>
        {hasLocalFilters && (
          <button
            onClick={clearLocalFilters}
            className="text-[11px] font-bold text-[#ed3a30] hover:underline shrink-0 mt-0.5"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Local Filters: faculty search | strand | status ── */}
      <div className="px-5 grid grid-cols-3 gap-2">

        {/* Faculty name search */}
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
            value={searchName}
            onChange={(e) => { setSearchName(e.target.value); setPage(1); }}
            className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#064db6]"
          />
        </div>

        {/* Strand filter */}
        <select
          value={filterStrand}
          onChange={(e) => { setFilterStrand(e.target.value); setPage(1); }}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          {allStrands.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Strands" : s}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          {allStatuses.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>

      </div>

      {/* ── Table ── */}
      <div className="px-5 overflow-x-auto">
        <div className="border border-[#e8edf5]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: "#002f73" }}>
                {["Faculty Name", "Strand", "Current Status", "Last Updated", "Recency"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-white font-bold px-4 py-2.5 whitespace-nowrap tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#9ca3af] text-xs">
                    No entries match the current filters.
                  </td>
                </tr>
              ) : (
                paginated.map((entry, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#f0f4ff] last:border-0"
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#f8faff" }}
                  >
                    <td className="px-4 py-2.5 font-semibold text-[#1a1a1a]">{entry.facultyName}</td>
                    <td className="px-4 py-2.5 text-[#4f4f4f]">{entry.strand}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="px-2.5 py-1 text-white text-[10px] font-bold whitespace-nowrap"
                        style={{ background: STATUS_COLORS[entry.currentStatus] ?? "#cbd5e1" }}
                      >
                        {entry.currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#4f4f4f]">{entry.lastUpdated}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 ${
                        entry.recency === "Recent"
                          ? "bg-[#e6f9ec] text-[#31ac52]"
                          : "bg-[#f5f5f5] text-[#4f4f4f]"
                      }`}>
                        {entry.recency}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
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