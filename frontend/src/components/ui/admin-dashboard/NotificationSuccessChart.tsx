// frontend/src/components/admin-dashboard/NotificationSuccessChart.tsx
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import type { NotificationSuccessChartProps } from "@/types/adminDashboard.types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function NotificationSuccessChart({ labels, sent, failed }: NotificationSuccessChartProps) {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Notification Success Rate</h3>
      <div className="flex-1" style={{ minHeight: 200 }}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Failed",
                data: failed,
                backgroundColor: "#ed3a30",
                borderRadius: 0,
                stack: "stack",
              },
              {
                label: "Sent",
                data: sent,
                backgroundColor: "#31ac52",
                borderRadius: 0,
                stack: "stack",
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: true,
                ticks: { font: { size: 11 }, color: "#4f4f4f" },
                grid: { display: false },
              },
              y: {
                stacked: true,
                ticks: { font: { size: 10 }, color: "#4f4f4f", maxTicksLimit: 6 },
                grid: { color: "#f0f4ff" },
              },
            },
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
          }}
        />
      </div>
    </div>
  );
}