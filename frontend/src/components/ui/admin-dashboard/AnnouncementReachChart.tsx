// frontend/src/components/admin-dashboard/AnnouncementReachChart.tsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import type { AnnouncementReachChartProps } from "@/types/adminDashboard.types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function AnnouncementReachChart({ labels, strandSpecific, schoolWide }: AnnouncementReachChartProps) {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Announcement Reach</h3>
      <div className="flex-1" style={{ minHeight: 200 }}>
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Strand-specific",
                data: strandSpecific,
                borderColor: "#064db6",
                backgroundColor: "rgba(6,77,182,0.12)",
                fill: true,
                tension: 0,
                pointRadius: 4,
                pointBackgroundColor: "#064db6",
              },
              {
                label: "School-wide",
                data: schoolWide,
                borderColor: "#9440dd",
                backgroundColor: "rgba(148,64,221,0.10)",
                fill: true,
                tension: 0,
                pointRadius: 4,
                pointBackgroundColor: "#9440dd",
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                labels: {
                  font: { size: 11 },
                  color: "#1a1a1a",
                  boxWidth: 12,
                  usePointStyle: true,
                  pointStyle: "rectRounded",
                },
              },
            },
            scales: {
              x: { ticks: { font: { size: 10 }, color: "#4f4f4f" }, grid: { display: false } },
              y: { ticks: { font: { size: 10 }, color: "#4f4f4f" }, grid: { color: "#f0f4ff" } },
            },
          }}
        />
      </div>
    </div>
  );
}