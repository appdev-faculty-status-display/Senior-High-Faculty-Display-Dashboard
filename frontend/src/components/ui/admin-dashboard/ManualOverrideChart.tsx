// frontend/src/components/admin-dashboard/ManualOverrideChart.tsx
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ManualOverrideChartProps } from "@/types/adminDashboard.types";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ManualOverrideChart({ autoStatus, manualOverride }: ManualOverrideChartProps) {
  const total = autoStatus + manualOverride;

  const legendItems = [
    { label: "Auto-Status",     value: autoStatus,     color: "#cbd5e1" },
    { label: "Manual Override", value: manualOverride, color: "#064db6" },
  ];

  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Manual Override Frequency</h3>

      <div className="flex justify-center">
        <div style={{ width: 150, height: 150 }}>
          <Pie
            data={{
              labels: legendItems.map((l) => l.label),
              datasets: [{
                data: [autoStatus, manualOverride],
                backgroundColor: ["#cbd5e1", "#064db6"],
                borderWidth: 2,
                borderColor: "#fff",
                borderRadius: 0,
              }],
            }}
            options={{
              responsive: false,
              plugins: { legend: { display: false }, tooltip: { enabled: true } },
            }}
            width={150}
            height={150}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        {legendItems.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-none flex-shrink-0" style={{ background: item.color }} />
              <span className="text-[11px] text-[#1a1a1a] font-semibold flex-1">{item.label}</span>
              <span className="text-[11px] font-black text-[#002f73]">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}