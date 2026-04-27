// frontend/src/pages/adminDashboard.tsx
import logo from "@/assets/logo.svg";
import { useState, type ReactNode } from "react";
import AddSchedule from "@/components/ui/admin-dashboard/addSchedule";
import AnnouncementPage from "@/pages/announcementPage";

// Chart Components
import StatusDistributionChart from "@/components/ui/admin-dashboard/StatusDistributionChart";
import ConsultationWindowChart from "@/components/ui/admin-dashboard/ConsulationWindowChart";
import ManualOverrideChart from "@/components/ui/admin-dashboard/ManualOverrideChart";
import RecencyLogTable from "@/components/ui/admin-dashboard/RecencyLogTable";
import ConsultationEfficiencyCard from "@/components/ui/admin-dashboard/ConsultationEfficiencyCard";
import CancellationRateChart from "@/components/ui/admin-dashboard/CancellationRateChart";
import ApprovalBottleneckCard from "@/components/ui/admin-dashboard/ApprovalBottleneckChart";
import RoomOccupancyChart from "@/components/ui/admin-dashboard/RoomOccupancyChart";
import AnnouncementReachChart from "@/components/ui/admin-dashboard/AnnouncementReachChart";
import NotificationSuccessChart from "@/components/ui/admin-dashboard/NotificationSuccessChart";
import UrgencyPurposeAnalysis from "@/components/ui/admin-dashboard/UrgencyPurposeAnalysis";

// Types
import type {
  ActiveNav,
  AdminAvatarProps,
  SidebarNavItemProps,
  MainContentProps,
} from "@/types/adminDashboard.types";

// Mock Data
import {
  NAV_ITEMS,
  MOCK_STATUS_DATA,
  MOCK_RECENCY_LOG,
  MOCK_ANNOUNCEMENT_LABELS,
  MOCK_STRAND_SPECIFIC,
  MOCK_SCHOOL_WIDE,
  MOCK_ROOM_OCCUPANCY,
  MOCK_CONSULTATION_WINDOW,
  MOCK_CONSULTATION_EFFICIENCY,
  MOCK_CANCELLATION_RATE,
  MOCK_APPROVAL_BOTTLENECK,
  MOCK_MANUAL_OVERRIDE,
  MOCK_NOTIFICATION_SUCCESS,
} from "@/data/adminDashboardData";


// Sub-components

function NULogo() {
  return (
    <img
      src={logo}
      alt="NU Logo"
      className="w-9 h-9 shrink-0 rounded-md object-contain"
    />
  );
}

function AdminAvatar({ name, role }: AdminAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-black text-[#002f73] leading-tight">{name}</p>
        <p className="text-xs text-[#4f4f4f] font-medium">{role}</p>
      </div>
      <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden border-2" style={{ borderColor: "#cbd5e1" }}>
        <div
          className="w-full h-full flex items-center justify-center text-white font-black text-xs"
          style={{ background: "linear-gradient(135deg, #064db6, #002f73)" }}
        >
          {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
      </div>
    </div>
  );
}

function SidebarNavItem({ item, active, onSelect, depth = 0 }: SidebarNavItemProps) {
  const isActive = active === item.id;
  return (
    <>
      <button
        onClick={() => onSelect(item.id)}
        className={`
          w-full text-left transition-all duration-150 select-none
          ${depth === 0 ? "px-4 py-3" : "px-6 py-2.5"}
          ${isActive
            ? "font-black text-white"
            : "font-bold text-[#1a1a1a] hover:bg-[#f0f4ff] hover:text-[#064db6]"
          }
        `}
        style={isActive ? { background: "#002f73" } : {}}
      >
        <span className={`${depth === 0 ? "text-sm" : "text-xs"} leading-snug`}>
          {item.label}
        </span>
      </button>
      {item.children?.map((child) => (
        <SidebarNavItem key={child.id} item={child} active={active} onSelect={onSelect} depth={depth + 1} />
      ))}
    </>
  );
}

// Page Sections
function FacultyActivityContent() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <StatusDistributionChart data={MOCK_STATUS_DATA} />
        <ConsultationWindowChart {...MOCK_CONSULTATION_WINDOW} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <RecencyLogTable entries={MOCK_RECENCY_LOG} />
        </div>
        <ManualOverrideChart {...MOCK_MANUAL_OVERRIDE} />
      </div>
    </div>
  );
}

function ConsultationContent() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <ConsultationEfficiencyCard {...MOCK_CONSULTATION_EFFICIENCY} />
        <CancellationRateChart {...MOCK_CANCELLATION_RATE} />
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <ApprovalBottleneckCard {...MOCK_APPROVAL_BOTTLENECK} />
        <UrgencyPurposeAnalysis />
      </div>
    </div>
  );
}

function ResourceCommunicationContent() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <NotificationSuccessChart {...MOCK_NOTIFICATION_SUCCESS} />
        <AnnouncementReachChart
          labels={MOCK_ANNOUNCEMENT_LABELS}
          strandSpecific={MOCK_STRAND_SPECIFIC}
          schoolWide={MOCK_SCHOOL_WIDE}
        />
      </div>
      <RoomOccupancyChart rooms={MOCK_ROOM_OCCUPANCY} />
    </div>
  );
}

// Main Content Router

function MainContent({ activeNav }: MainContentProps) {
  const contentMap: Record<string, ReactNode> = {
    "faculty-activity":       <FacultyActivityContent />,
    "consultation":           <ConsultationContent />,
    "resource-communication": <ResourceCommunicationContent />,
    "add-announcement":       <AnnouncementPage />,
    "add-schedule":           <AddSchedule />,
  };

  return (
    <div className="flex-1 min-h-0 bg-[#f8faff] overflow-y-auto">
      {contentMap[activeNav] ?? null}
    </div>
  );
}

// Main Layout

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<ActiveNav>("faculty-activity");

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-2 bg-white border-b border-[#cbd5e1]">
        <div className="flex items-center gap-2">
          <NULogo />
          <div>
            <h1 className="text-base font-black leading-tight tracking-wide" style={{ color: "#002f73" }}>
              NU LAGUNA
            </h1>
            <p className="text-[11px] font-bold tracking-widest uppercase leading-none" style={{ color: "#064db6" }}>
              SSHS Faculty Board
            </p>
          </div>
        </div>
        <AdminAvatar name="Admin Account" role="SSHS Principal" />
      </header>

      {/* ── Accent Bar ── */}
      <div
        className="h-2 w-full shrink-0"
        style={{ background: "linear-gradient(to right, #ffc107 0%, #ffd41c 20%, #d4a800 40%, #003a8f 70%, #002f73 100%)" }}
      />

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className="shrink-0 flex flex-col bg-white border-r border-[#cbd5e1]" style={{ width: "160px" }}>
          <nav className="flex flex-col pt-4">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem key={item.id} item={item} active={activeNav} onSelect={setActiveNav} />
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8faff]">
          <MainContent activeNav={activeNav} />
        </main>

      </div>
    </div>
  );
}