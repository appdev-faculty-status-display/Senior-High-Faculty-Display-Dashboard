// frontend/src/components/ui/admin-dashboard/DatePicker.tsx

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  label,
}: DatePickerProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className="text-[10px] font-bold text-[#4f4f4f] uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="relative flex items-center">
        {/* Calendar icon */}
        <svg
          className="absolute left-2 text-[#4f4f4f] pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title={placeholder}
          className="pl-7 pr-2 py-1.5 text-xs border border-[#cbd5e1] bg-white text-[#1a1a1a] focus:outline-none focus:border-[#064db6] focus:ring-1 focus:ring-[#064db6]/20 transition-colors w-[130px] cursor-pointer"
        />
        {/* Clear button — only shown when a value is set */}
        {value && (
          <button
            onClick={() => onChange("")}
            title="Clear date"
            className="absolute right-1.5 text-[#9ca3af] hover:text-[#ed3a30] transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// DateRangePicker

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      <DatePicker value={from} onChange={onFromChange} placeholder="From date" />
      <span className="text-xs text-[#4f4f4f] font-semibold shrink-0">–</span>
      <DatePicker value={to} onChange={onToChange} placeholder="To date" />
    </div>
  );
}