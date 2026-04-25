// frontend/src/components/admin-dashboard/ConsulationWindowChart.tsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import type { ConsultationWindowChartProps } from "@/types/adminDashboard.types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const lineOptions = (yLabel: string) => ({
  responsive: false as const,
  maintainAspectRatio: false as const,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { font: { family: "'Segoe UI', sans-serif", size: 9 }, color: "#4f4f4f" },
      grid: { display: false },
    },
    y: {
      title: { display: true, text: yLabel, font: { size: 9 }, color: "#4f4f4f" },
      ticks: { font: { size: 9 }, color: "#4f4f4f", maxTicksLimit: 5 },
      grid: { color: "#f0f4ff" },
    },
  },
});

export default function ConsultationWindowChart({
  activeLabels, activeWindows, durationLabels, avgDuration,
}: ConsultationWindowChartProps) {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Consultation Window Utilization</h3>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold text-[#064db6] text-center">Active Windows</p>
          <div style={{ height: 140 }}>
            <Line
              data={{
                labels: activeLabels,
                datasets: [{
                  data: activeWindows,
                  borderColor: "#064db6",
                  backgroundColor: "rgba(6,77,182,0.08)",
                  pointBackgroundColor: "#064db6",
                  pointRadius: 4,
                  tension: 0.35,
                  fill: true,
                }],
              }}
              options={lineOptions("Active Windows")}
              width={undefined}
              height={140}
              style={{ width: "100%", height: 140 }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold text-[#064db6] text-center">Average Duration</p>
          <div style={{ height: 140 }}>
            <Line
              data={{
                labels: durationLabels,
                datasets: [{
                  data: avgDuration,
                  borderColor: "#064db6",
                  backgroundColor: "rgba(6,77,182,0.08)",
                  pointBackgroundColor: "#064db6",
                  pointRadius: 4,
                  tension: 0.35,
                  fill: true,
                }],
              }}
              options={lineOptions("Duration (minutes)")}
              width={undefined}
              height={140}
              style={{ width: "100%", height: 140 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}