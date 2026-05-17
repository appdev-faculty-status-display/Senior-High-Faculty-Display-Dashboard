// frontend/src/components/ui/admin-dashboard/StatusDistributionChart.tsx
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { StatusDistributionChartProps } from "@/types/adminDashboard.types";

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_CONFIG = [
  { label: "In Meeting",     color: "#9440dd" },
  { label: "Off Campus",     color: "#ff914d" },
  { label: "In Class",       color: "#ffef5f" },
  { label: "Available",      color: "#31ac52" },
  { label: "Do Not Disturb", color: "#ed3a30" },
  { label: "On Break",       color: "#3b74fa" },
];

export default function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const labels = STATUS_CONFIG.map((s) => s.label);
  const values = STATUS_CONFIG.map((s) => data[s.label] ?? 0);
  const colors = STATUS_CONFIG.map((s) => s.color);
  const total  = values.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Status Distribution</h3>

      <div className="flex items-center gap-5 flex-1">

        {/* Legend — left side */}
        <div className="flex flex-col gap-2 flex-1">
          {STATUS_CONFIG.map((s) => {
            const count = data[s.label] ?? 0;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-none shrink-0" style={{ background: s.color }} />
                <span className="text-[11px] text-[#1a1a1a] font-semibold flex-1 leading-tight">
                  {s.label}
                </span>
                <span className="text-[11px] font-black text-[#002f73] w-4 text-right">
                  {count}
                </span>
                <span className="text-[10px] text-[#4f4f4f] w-10 text-right">
                  ({pct}%)
                </span>
              </div>
            );
          })}
        </div>

        {/* Donut chart — center/right */}
        <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
          <Doughnut
            data={{
              labels,
              datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }],
            }}
            options={{
              responsive: false,
              cutout: "62%",
              plugins: { legend: { display: false }, tooltip: { enabled: true } },
            }}
            width={150}
            height={150}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-[#002f73] leading-none">{total}</span>
            <span className="text-[9px] text-[#4f4f4f] font-medium">Total</span>
          </div>
        </div>

      </div>
    </div>
  );
}