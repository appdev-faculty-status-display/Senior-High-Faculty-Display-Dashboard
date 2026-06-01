// frontend/src/components/admin-dashboard/ConsultationEfficiencyCard.tsx
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import type { ConsultationEfficiencyCardProps } from "@/types/adminDashboard.types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ConsultationEfficiencyCard({ quickConsultations, consultationRoom }: ConsultationEfficiencyCardProps) {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Consultation Efficiency and Demand</h3>

      <div className="flex gap-4 flex-1 items-stretch">
        <div className="flex flex-col gap-1 flex-1">
          <p className="text-[11px] font-bold text-[#064db6] text-center">Request Volume by Type</p>
          <div style={{ height: 220 }}>
            <Bar
              data={{
                labels: ["Quick Consultations", "Consultation Room"],
                datasets: [{
                  data: [quickConsultations, consultationRoom],
                  backgroundColor: ["#ffc107", "#002f73"],
                  borderRadius: 0,
                  barThickness: 48,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    ticks: { font: { size: 10 }, color: "#4f4f4f" },
                    grid: { display: false },
                  },
                  y: {
                    ticks: { font: { size: 10 }, color: "#4f4f4f", maxTicksLimit: 6 },
                    grid: { color: "#f0f4ff" },
                    beginAtZero: true,
                  },
                },
              }}
              height={220}
            />
          </div>
        </div>
      </div>
    </div>
  );
}