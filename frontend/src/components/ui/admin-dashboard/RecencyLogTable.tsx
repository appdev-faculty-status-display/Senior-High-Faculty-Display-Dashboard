// frontend/src/components/ui/admin-dashboard/RecencyLogTable.tsx
import { useState, useMemo } from "react";
import type { RecencyLogEntry, RecencyLogTableProps } from "@/types/adminDashboard.types";

export type { RecencyLogEntry };

const STATUS_COLORS: Record<string, string> = {
  "In Meeting":     "#9440dd",
  "In Class":       "#b8a000",
  "On Break":       "#3b74fa",
  "Available":      "#31ac52",
  "Do Not Disturb": "#ed3a30",
  "Off Campus":     "#ff914d",
};

// Converts "08:30 AM" → total minutes from midnight for comparison
function timeToMinutes(str: string): number {
  const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// Converts "HH:MM" input (24h) → total minutes from midnight
function inputToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default function RecencyLogTable({ entries }: RecencyLogTableProps) {
  const [searchName,     setSearchName]     = useState("");
  const [filterRecency,  setFilterRecency]  = useState<"All" | "Recent" | "Older">("All");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [timeFrom,       setTimeFrom]       = useState("");
  const [timeTo,         setTimeTo]         = useState("");

  const allStatuses = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.currentStatus)))],
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const nameMatch = entry.facultyName
        .toLowerCase()
        .includes(searchName.toLowerCase());

      const recencyMatch =
        filterRecency === "All" || entry.recency === filterRecency;

      const statusMatch =
        filterStatus === "All" || entry.currentStatus === filterStatus;

      const entryMinutes  = timeToMinutes(entry.lastUpdated);
      const fromMinutes   = timeFrom ? inputToMinutes(timeFrom) : null;
      const toMinutes     = timeTo   ? inputToMinutes(timeTo)   : null;

      const timeMatch =
        (fromMinutes === null || entryMinutes >= fromMinutes) &&
        (toMinutes   === null || entryMinutes <= toMinutes);

      return nameMatch && recencyMatch && statusMatch && timeMatch;
    });
  }, [entries, searchName, filterRecency, filterStatus, timeFrom, timeTo]);

  const hasActiveFilters =
    searchName || filterRecency !== "All" || filterStatus !== "All" || timeFrom || timeTo;

  function clearFilters() {
    setSearchName("");
    setFilterRecency("All");
    setFilterStatus("All");
    setTimeFrom("");
    setTimeTo("");
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
            Filter by faculty name, status, or time range.
          </p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold text-[#ed3a30] hover:underline shrink-0 mt-0.5"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="px-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Name search */}
        <div className="col-span-2 sm:col-span-1 relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4f4f4f]"
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#064db6]"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          {allStatuses.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
          ))}
        </select>

        {/* Recency filter */}
        <select
          value={filterRecency}
          onChange={(e) => setFilterRecency(e.target.value as "All" | "Recent" | "Older")}
          className="py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
        >
          <option value="All">All Recency</option>
          <option value="Recent">Recent</option>
          <option value="Older">Older</option>
        </select>

        {/* Time range — HH:MM inputs converted directly to minutes, no intermediate vars */}
        <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
          <input
            type="time"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.target.value)}
            title="From time"
            className="flex-1 py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
          />
          <span className="text-[10px] text-[#4f4f4f] font-semibold shrink-0">to</span>
          <input
            type="time"
            value={timeTo}
            onChange={(e) => setTimeTo(e.target.value)}
            title="To time"
            className="flex-1 py-1.5 px-2 text-[11px] border border-[#cbd5e1] bg-[#f8faff] text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 pb-5 overflow-x-auto">
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#9ca3af] text-xs">
                    No entries match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((entry, i) => (
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
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 ${
                          entry.recency === "Recent"
                            ? "bg-[#e6f9ec] text-[#31ac52]"
                            : "bg-[#f5f5f5] text-[#4f4f4f]"
                        }`}
                      >
                        {entry.recency}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#9ca3af] mt-2">
          Showing {filtered.length} of {entries.length} entries
        </p>
      </div>
    </div>
  );
}