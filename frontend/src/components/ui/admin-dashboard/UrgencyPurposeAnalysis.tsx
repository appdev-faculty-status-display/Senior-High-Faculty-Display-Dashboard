// frontend/src/components/admin-dashboard/UrgencyPurposeAnalysis.tsx

interface WordItem {
  label: string;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  color: string;
  weight?: "normal" | "bold" | "black";
}

const WORDS: WordItem[] = [
  { label: "Grades",       size: "xl",  color: "#ed3a30", weight: "black"  },
  { label: "Clearance",    size: "lg",  color: "#1a1a1a", weight: "black"  },
  { label: "Schedule",     size: "md",  color: "#9440dd", weight: "bold"   },
  { label: "Research",     size: "sm",  color: "#4f4f4f", weight: "normal" },
  { label: "Requirements", size: "md",  color: "#064db6", weight: "bold"   },
  { label: "Project",      size: "sm",  color: "#ffc107", weight: "bold"   },
  { label: "Capstone",     size: "sm",  color: "#ff914d", weight: "normal" },
  { label: "TOR",          size: "sm",  color: "#3b74fa", weight: "bold"   },
  { label: "final grade",  size: "sm",  color: "#1a1a1a", weight: "normal" },
];

const SIZE_MAP: Record<WordItem["size"], string> = {
  xs: "text-[11px]",
  sm: "text-[13px]",
  md: "text-[16px]",
  lg: "text-[22px]",
  xl: "text-[36px]",
};

const WEIGHT_MAP: Record<NonNullable<WordItem["weight"]>, string> = {
  normal: "font-medium",
  bold:   "font-bold",
  black:  "font-black",
};

export default function UrgencyPurposeAnalysis() {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Urgency and Purpose Analysis</h3>

      <div className="flex-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 py-2">
        {WORDS.map((word) => (
          <span
            key={word.label}
            className={`
              leading-tight select-none
              ${SIZE_MAP[word.size]}
              ${WEIGHT_MAP[word.weight ?? "normal"]}
            `}
            style={{ color: word.color }}
          >
            {word.label}
          </span>
        ))}
      </div>
    </div>
  );
}