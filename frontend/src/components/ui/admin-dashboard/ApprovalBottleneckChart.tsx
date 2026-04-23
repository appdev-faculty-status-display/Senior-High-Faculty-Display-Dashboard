// frontend/src/components/admin-dashboard/ApprovalBottleneckChart.tsx
import type { ApprovalBottleneckCardProps } from "@/types/adminDashboard.types";

export default function ApprovalBottleneckCard({ facultyApprovalMin, strandHeadApprovalMin }: ApprovalBottleneckCardProps) {
  return (
    <div className="bg-white rounded-none border border-[#cbd5e1] p-5 shadow-sm">
      <h3 className="text-sm font-black text-[#002f73] mb-5">Approval Bottleneck Tracking</h3>

      <div className="flex items-center justify-center gap-8">
        {/* Faculty Approval */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-[10px] font-black px-4 py-1.5 rounded-none text-[#002f73] uppercase tracking-wider"
            style={{ background: "#ffc107" }}
          >
            Faculty Approval
          </span>
          <p className="text-xs text-[#4f4f4f] font-semibold uppercase tracking-wider">AVG.</p>
          <p className="text-4xl font-black text-[#1a1a1a] leading-none">
            {facultyApprovalMin} <span className="text-lg font-bold">min</span>
          </p>
        </div>

        {/* Arrow */}
        <svg width="48" height="28" viewBox="0 0 48 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 8H36V0L48 14L36 28V20H0V8Z" fill="#002f73" />
        </svg>

        {/* Strand Head Approval */}
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-[10px] font-black px-4 py-1.5 rounded-none text-[#002f73] uppercase tracking-wider"
            style={{ background: "#ffc107" }}
          >
            Strand Head Approval
          </span>
          <p className="text-xs text-[#4f4f4f] font-semibold uppercase tracking-wider">AVG.</p>
          <p className="text-4xl font-black text-[#1a1a1a] leading-none">
            {strandHeadApprovalMin} <span className="text-lg font-bold">min</span>
          </p>
        </div>
      </div>
    </div>
  );
}