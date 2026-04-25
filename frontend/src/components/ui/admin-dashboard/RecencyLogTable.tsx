// frontend/src/components/admin-dashboard/RecencyLogTable.tsx
import type { RecencyLogEntry, RecencyLogTableProps } from "@/types/adminDashboard.types";

// Re-export so any file that imported RecencyLogEntry from here still works
export type { RecencyLogEntry };

const STATUS_COLORS: Record<string, string> = {
  "In Meeting":     "#9440dd",
  "In Class":       "#b8a000",
  "On Break":       "#3b74fa",
  "Available":      "#31ac52",
  "Do Not Disturb": "#ed3a30",
  "Off Campus":     "#ff914d",
};

export default function RecencyLogTable({ entries }: RecencyLogTableProps) {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Last-updated Recency Log</h3>
      <div className="overflow-x-auto rounded-none border border-[#e8edf5]">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: "#002f73" }}>
              {["Faculty Name", "Strand", "Current Status", "Last Updated", "Recency"].map((h) => (
                <th key={h} className="text-left text-white font-bold px-4 py-2.5 whitespace-nowrap first:rounded-tl-none last:rounded-tr-none">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={i}
                className="border-b border-[#f0f4ff] last:border-0"
                style={{ background: i % 2 === 0 ? "#ffffff" : "#f8faff" }}
              >
                <td className="px-4 py-2.5 font-semibold text-[#1a1a1a]">{entry.facultyName}</td>
                <td className="px-4 py-2.5 text-[#4f4f4f]">{entry.strand}</td>
                <td className="px-4 py-2.5">
                  <span
                    className="px-2.5 py-1 rounded-none text-white text-[10px] font-bold whitespace-nowrap"
                    style={{ background: STATUS_COLORS[entry.currentStatus] ?? "#cbd5e1" }}
                  >
                    {entry.currentStatus}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[#4f4f4f]">{entry.lastUpdated}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-none ${
                      entry.recency === "Recent"
                        ? "bg-[#e6f9ec] text-[#31ac52]"
                        : "bg-[#f5f5f5] text-[#4f4f4f]"
                    }`}
                  >
                    {entry.recency}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}