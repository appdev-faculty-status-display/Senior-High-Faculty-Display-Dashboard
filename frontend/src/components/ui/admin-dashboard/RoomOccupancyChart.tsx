// frontend/src/components/admin-dashboard/RoomOccupancyChart.tsx
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import type { RoomData, RoomOccupancyChartProps } from "@/types/adminDashboard.types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Re-export so any file that imported RoomData from here still works
export type { RoomData };

export default function RoomOccupancyChart({ rooms }: RoomOccupancyChartProps) {
  const chartHeight = Math.max(160, rooms.length * 60);

  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm">
      <h3 className="text-sm font-black text-[#002f73] mb-3">Room Occupancy Rates</h3>
      <div style={{ height: chartHeight }}>
        <Bar
          data={{
            labels: rooms.map((r) => r.room),
            datasets: [
              {
                label: "Used",
                data: rooms.map((r) => r.used),
                backgroundColor: "#cbd5e1",
                borderRadius: 0,
                stack: "stack",
              },
              {
                label: "Available",
                data: rooms.map((r) => r.available),
                backgroundColor: "#31ac52",
                borderRadius: 0,
                stack: "stack",
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            scales: {
              x: {
                stacked: true,
                max: 100,
                ticks: {
                  callback: (v) => `${v}%`,
                  font: { size: 10 },
                  color: "#4f4f4f",
                },
                grid: { color: "#f0f4ff" },
              },
              y: {
                stacked: true,
                ticks: { font: { size: 11 }, color: "#4f4f4f" },
                grid: { display: false },
              },
            },
            plugins: {
              legend: {
                position: "top",
                labels: {
                  font: { size: 11 },
                  color: "#1a1a1a",
                  boxWidth: 12,
                  boxHeight: 12,
                  usePointStyle: true,
                  pointStyle: "rectRounded",
                },
              },
              tooltip: {
                callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` },
              },
            },
          }}
          height={chartHeight}
        />
      </div>
    </div>
  );
}