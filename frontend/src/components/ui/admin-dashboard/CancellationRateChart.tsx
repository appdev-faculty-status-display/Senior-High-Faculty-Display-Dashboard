// frontend/src/components/admin-dashboard/CancellationRateChart.tsx
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { CancellationRateChartProps } from "@/types/adminDashboard.types";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CancellationRateChart({ resolved, scheduleConflict, longWaitTime }: CancellationRateChartProps) {
  const total = resolved + scheduleConflict + longWaitTime;
  const longWaitPct = total > 0 ? ((longWaitTime / total) * 100).toFixed(1) : "0.0";

  const legendItems = [
    { label: "Resolved",          value: resolved,         color: "#cbd5e1" },
    { label: "Schedule Conflict",  value: scheduleConflict, color: "#9440dd" },
    { label: "Long wait time",    value: longWaitTime,     color: "#ed3a30" },
  ];

  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Request Cancellation Rate</h3>

      <div className="flex justify-center">
        <div className="relative" style={{ width: 180, height: 180 }}>
          <Doughnut
            data={{
              labels: legendItems.map((l) => l.label),
              datasets: [{
                data: [resolved, scheduleConflict, longWaitTime],
                backgroundColor: legendItems.map((l) => l.color),
                borderWidth: 3,
                borderColor: "#fff",
                borderRadius: 0,
              }],
            }}
            options={{
              responsive: false,
              cutout: "62%",
              plugins: { legend: { display: false }, tooltip: { enabled: true } },
            }}
            width={180}
            height={180}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {legendItems.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-none shrink-0" style={{ background: item.color }} />
              <span className="text-[11px] text-[#1a1a1a] font-semibold flex-1">{item.label}</span>
              <span className="text-[11px] font-black text-[#4f4f4f]">{pct}%</span>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-1">
        <span className="text-2xl font-black text-[#ed3a30]">{longWaitPct}%</span>
        <span className="text-xs text-[#4f4f4f] ml-1.5">as of today</span>
      </div>
    </div>
  );
}