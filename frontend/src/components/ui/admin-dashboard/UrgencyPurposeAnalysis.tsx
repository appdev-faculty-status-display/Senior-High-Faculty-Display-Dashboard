// frontend/src/components/admin-dashboard/UrgencyPurposeAnalysis.tsx

interface PurposeItem {
  label: string;
  count: number;
}

interface UrgencyPurposeAnalysisProps {
  items: PurposeItem[];
}

const COLOR_MAP: Record<string, string> = {
  Grades: "#ed3a30",
  Clearance: "#1a1a1a",
  Schedule: "#9440dd",
  Research: "#4f4f4f",
  Requirements: "#064db6",
  Project: "#ffc107",
  Capstone: "#ff914d",
  TOR: "#3b74fa",
  "Final Grade": "#1a1a1a",
  Other: "#6b7280",
};

const SIZE_MAP: Record<WordItem["size"], string> = {
  xs: "text-[11px]",
  sm: "text-[13px]",
  md: "text-[16px]",
  lg: "text-[22px]",
  xl: "text-[36px]",
};

const WEIGHT_MAP: Record<"normal" | "bold" | "black", string> = {
  normal: "font-medium",
  bold:   "font-bold",
  black:  "font-black",
};

function sizeFromCount(count: number, max: number) {
  if (max === 0) return "xs";
  const ratio = count / max;
  if (ratio >= 0.75) return "xl";
  if (ratio >= 0.5) return "lg";
  if (ratio >= 0.3) return "md";
  if (ratio >= 0.15) return "sm";
  return "xs";
}

export default function UrgencyPurposeAnalysis({ items }: UrgencyPurposeAnalysisProps) {
  const max = items.reduce((acc, item) => Math.max(acc, item.count), 0);
  const hasData = items.some((item) => item.count > 0);

  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Urgency and Purpose Analysis</h3>

      {hasData ? (
        <div className="flex-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 py-2">
          {items.map((item) => {
            const size = sizeFromCount(item.count, max);
            const weight = size === "xl" ? "black" : size === "lg" ? "bold" : "normal";
            return (
              <span
                key={item.label}
                className={`leading-tight select-none ${SIZE_MAP[size]} ${WEIGHT_MAP[weight]}`}
                style={{ color: COLOR_MAP[item.label] || "#4f4f4f" }}
              >
                {item.label}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[#4f4f4f]">
          No purpose data yet.
        </div>
      )}
    </div>
  );
}