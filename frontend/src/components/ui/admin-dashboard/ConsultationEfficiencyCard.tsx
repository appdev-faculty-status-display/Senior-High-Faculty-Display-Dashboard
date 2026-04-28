// frontend/src/components/admin-dashboard/ConsultationEfficiencyCard.tsx
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import type { ConsultationEfficiencyCardProps } from "@/types/adminDashboard.types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ConsultationEfficiencyCard({
  quickConsultations,
  consultationRoom,
  avgQueueWaitMin,
}: ConsultationEfficiencyCardProps) {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm flex flex-col gap-3 h-full">
      <h3 className="text-sm font-black text-[#002f73]">Consultation Efficiency and Demand</h3>

      <div className="flex gap-4 flex-1 items-stretch">
        <div className="flex flex-col gap-1 flex-1">
          <p className="text-[11px] font-bold text-[#064db6] text-center">Request Volume by Type</p>
          <div style={{ height: 180 }}>
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
              height={180}
            />
          </div>
        </div>

        <div
          className="rounded-none flex flex-col items-center justify-center gap-2 px-6 py-4 shrink-0"
          style={{ background: "#ffc107", minWidth: 160 }}
        >
          <p className="text-[10px] font-black text-[#002f73] uppercase tracking-widest text-center leading-tight">
            Average Queue<br />Wait Time
          </p>
          <div className="flex items-end gap-1">
            <span className="text-5xl font-black text-[#002f73] leading-none">{avgQueueWaitMin}</span>
            <span className="text-xl font-bold text-[#002f73] mb-1">min</span>
          </div>
          <div className="w-10 h-10 rounded-none border-2 border-[#002f73] flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#002f73" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}