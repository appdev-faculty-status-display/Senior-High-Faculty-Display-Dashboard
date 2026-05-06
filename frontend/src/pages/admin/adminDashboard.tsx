// frontend/src/pages/admin/adminDashboard.tsx
import { useState, useRef, type ReactNode } from "react";
import AddSchedule    from "@/components/ui/admin-dashboard/addSchedule";
import Header         from "@/components/ui/header/header";
import AddAnnouncement from "@/pages/admin/announcementPage";

// Chart Components
import StatusDistributionChart       from "@/components/ui/admin-dashboard/StatusDistributionChart";
import ConsultationWindowChart       from "@/components/ui/admin-dashboard/ConsulationWindowChart";
import ManualOverrideChart           from "@/components/ui/admin-dashboard/ManualOverrideChart";
import RecencyLogTable               from "@/components/ui/admin-dashboard/RecencyLogTable";
import ConsultationEfficiencyCard    from "@/components/ui/admin-dashboard/ConsultationEfficiencyCard";
import CancellationRateChart         from "@/components/ui/admin-dashboard/CancellationRateChart";
import ApprovalBottleneckCard        from "@/components/ui/admin-dashboard/ApprovalBottleneckChart";
import RoomOccupancyChart            from "@/components/ui/admin-dashboard/RoomOccupancyChart";
import AnnouncementReachChart        from "@/components/ui/admin-dashboard/AnnouncementReachChart";
import NotificationSuccessChart      from "@/components/ui/admin-dashboard/NotificationSuccessChart";
import UrgencyPurposeAnalysis        from "@/components/ui/admin-dashboard/UrgencyPurposeAnalysis";
import ConsultationParticipantsTable from "@/components/ui/admin-dashboard/ConsultationParticipantsTable";

// Types
import type { ActiveNav, SidebarNavItemProps, MainContentProps } from "@/types/adminDashboard.types";

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
  MOCK_CONSULTATION_PARTICIPANTS,
} from "@/data/mockAdminDashboardData";

// Utils 
import { downloadCSV }  from "@/utils/csvEscapeHelper";
import { printElement } from "@/utils/pdfExportHelper";

// Shared: Export Buttons 

interface ExportButtonsProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
}

function ExportButtons({ onExportCSV, onExportPDF }: ExportButtonsProps) {
  return (
    <>
      <button
        onClick={onExportCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export CSV
      </button>
      <button
        onClick={onExportPDF}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        Export PDF
      </button>
    </>
  );
}

// ─── Shared: Page Header (title + description + global filters + export) ──────

interface PageHeaderProps {
  title: string;
  description: string;
  filters?: ReactNode;   // global filter controls
  actions?: ReactNode;   // export buttons
}

function PageHeader({ title, description, filters, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
      {/* Left: title + description */}
      <div className="shrink-0">
        <h2 className="text-2xl font-extrabold text-[#002f73] tracking-tight uppercase leading-tight">
          {title}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>

      {/* Right: global filters + export buttons on same line */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// Shared: Date range input pair

interface DateRangeProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

function DateRangeFilter({ from, to, onFromChange, onToChange }: DateRangeProps) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="py-1.5 px-2 text-xs border border-[#cbd5e1] bg-white text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
      />
      <span className="text-xs text-[#4f4f4f] font-semibold shrink-0">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="py-1.5 px-2 text-xs border border-[#cbd5e1] bg-white text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
      />
    </div>
  );
}

// Page: Faculty Activity
// Global filter: date range only
// Layout: Status + ConsultationWindow + ManualOverride in one row, RecencyLog below

function FacultyActivityContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);

  // Global filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  function handleExportCSV() {
    downloadCSV(
      [
        ["Metric", "Value"],
        ...Object.entries(MOCK_STATUS_DATA).map(([k, v]) => [k, String(v)]),
        ["---", "---"],
        ["Faculty Name", "Strand", "Status", "Last Updated", "Recency"],
        ...MOCK_RECENCY_LOG.map((e) => [e.facultyName, e.strand, e.currentStatus, e.lastUpdated, e.recency]),
      ],
      "faculty_activity_analytics"
    );
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Faculty Activity Analytics");
  }

  return (
    <div className="p-6 flex flex-col gap-6 font-[Inter,sans-serif]">
      <PageHeader
        title="Faculty Activity"
        description="Overview of faculty statuses, consultation windows, and recency updates."
        filters={
          <DateRangeFilter
            from={dateFrom} to={dateTo}
            onFromChange={setDateFrom} onToChange={setDateTo}
          />
        }
        actions={<ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      />

      <div ref={analyticsRef} className="flex flex-col gap-6">
        {/* Row 1: Status + Consultation Window + Manual Override — all 3 in one line */}
        <div className="grid grid-cols-3 gap-6">
          <StatusDistributionChart data={MOCK_STATUS_DATA} />
          <ConsultationWindowChart {...MOCK_CONSULTATION_WINDOW} />
          <ManualOverrideChart {...MOCK_MANUAL_OVERRIDE} />
        </div>

        {/* Row 2: Recency Log (full width) with pagination + local filters */}
        <RecencyLogTable
          entries={MOCK_RECENCY_LOG}
          globalTimeFrom={dateFrom}
          globalTimeTo={dateTo}
        />
      </div>
    </div>
  );
}

// Page: Consultation
// Global filter: date range + faculty name

function ConsultationContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);

  // Global filter state
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [facultySearch, setFacultySearch] = useState("");

  function handleExportCSV() {
    downloadCSV(
      [
        ["Metric", "Value"],
        ["Quick Consultations",      String(MOCK_CONSULTATION_EFFICIENCY.quickConsultations)],
        ["Consultation Room",        String(MOCK_CONSULTATION_EFFICIENCY.consultationRoom)],
        ["Avg Queue Wait (min)",     String(MOCK_CONSULTATION_EFFICIENCY.avgQueueWaitMin)],
        ["Resolved (%)",             String(MOCK_CANCELLATION_RATE.resolved)],
        ["Schedule Conflict (%)",    String(MOCK_CANCELLATION_RATE.scheduleConflict)],
        ["Long Wait Time (%)",       String(MOCK_CANCELLATION_RATE.longWaitTime)],
        ["Faculty Approval (min)",   String(MOCK_APPROVAL_BOTTLENECK.facultyApprovalMin)],
        ["Strand Head Approval (min)", String(MOCK_APPROVAL_BOTTLENECK.strandHeadApprovalMin)],
      ],
      "consultation_analytics"
    );
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Consultation Analytics");
  }

  return (
    <div className="p-6 flex flex-col gap-6 font-[Inter,sans-serif]">
      <PageHeader
        title="Consultation"
        description="Demand metrics, cancellation trends, approval bottlenecks, and participant records."
        filters={
          <div className="flex items-center gap-2">
            <DateRangeFilter
              from={dateFrom} to={dateTo}
              onFromChange={setDateFrom} onToChange={setDateTo}
            />
            {/* Faculty search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4f4f4f]" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Faculty name..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="pl-7 pr-2 py-1.5 text-xs border border-[#cbd5e1] bg-white text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#064db6] w-36"
              />
            </div>
          </div>
        }
        actions={<ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      />

      <div ref={analyticsRef} className="flex flex-col gap-6">
        <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
          <ConsultationEfficiencyCard {...MOCK_CONSULTATION_EFFICIENCY} />
          <CancellationRateChart {...MOCK_CANCELLATION_RATE} />
        </div>
        <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
          <ApprovalBottleneckCard {...MOCK_APPROVAL_BOTTLENECK} />
          <UrgencyPurposeAnalysis />
        </div>
      </div>

      {/* Participants table — receives global filters, has its own local filters */}
      <ConsultationParticipantsTable
        participants={MOCK_CONSULTATION_PARTICIPANTS}
        globalFaculty={facultySearch}
        globalDateFrom={dateFrom}
        globalDateTo={dateTo}
      />
    </div>
  );
}

// Page: Resource & Communication
// Global filter: date range + strand
// Layout: AnnouncementReach full width first, then Notification + RoomOccupancy

function ResourceCommunicationContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);

  // Global filter state
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [strandFilter, setStrandFilter] = useState("All");

  const STRANDS = ["All", "STEM", "ABM", "HUMSS", "TVL", "GAS"];

  function handleExportCSV() {
    downloadCSV(
      [
        ["Month", "Strand-Specific Reach", "School-Wide Reach"],
        ...MOCK_ANNOUNCEMENT_LABELS.map((label, i) => [
          label, String(MOCK_STRAND_SPECIFIC[i]), String(MOCK_SCHOOL_WIDE[i]),
        ]),
        ["---", "---", "---"],
        ["Channel", "Sent", "Failed"],
        ...MOCK_NOTIFICATION_SUCCESS.labels.map((label, i) => [
          label,
          String(MOCK_NOTIFICATION_SUCCESS.sent[i]),
          String(MOCK_NOTIFICATION_SUCCESS.failed[i]),
        ]),
        ["---", "---", "---"],
        ["Room", "Used (%)", "Available (%)"],
        ...MOCK_ROOM_OCCUPANCY.map((r) => [r.room, String(r.used), String(r.available)]),
      ],
      "resource_communication_analytics"
    );
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Resource & Communication Analytics");
  }

  return (
    <div className="p-6 flex flex-col gap-6 font-[Inter,sans-serif]">
      <PageHeader
        title="Resource & Communication"
        description="Announcement reach, notification success rates, and room occupancy statistics."
        filters={
          <div className="flex items-center gap-2">
            <DateRangeFilter
              from={dateFrom} to={dateTo}
              onFromChange={setDateFrom} onToChange={setDateTo}
            />
            <select
              value={strandFilter}
              onChange={(e) => setStrandFilter(e.target.value)}
              className="py-1.5 px-2 text-xs border border-[#cbd5e1] bg-white text-[#1a1a1a] focus:outline-none focus:border-[#064db6]"
            >
              {STRANDS.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Strands" : s}</option>
              ))}
            </select>
          </div>
        }
        actions={<ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      />

      <div ref={analyticsRef} className="flex flex-col gap-6">
        {/* Announcement Reach — full width, moved to top */}
        <AnnouncementReachChart
          labels={MOCK_ANNOUNCEMENT_LABELS}
          strandSpecific={MOCK_STRAND_SPECIFIC}
          schoolWide={MOCK_SCHOOL_WIDE}
        />

        {/* Notification Success + Room Occupancy side by side */}
        <div className="grid grid-cols-2 gap-6">
          <NotificationSuccessChart {...MOCK_NOTIFICATION_SUCCESS} />
          <RoomOccupancyChart rooms={MOCK_ROOM_OCCUPANCY} />
        </div>
      </div>
    </div>
  );
}

// Sidebar Nav Item

function SidebarNavItem({ item, active, onSelect, depth = 0 }: SidebarNavItemProps) {
  const isActive = active === item.id;
  return (
    <>
      <button
        onClick={() => onSelect(item.id)}
        className={`
          w-full text-left transition-all duration-150 select-none font-[Inter,sans-serif]
          ${depth === 0 ? "px-4 py-3" : "px-6 py-2.5"}
          ${isActive
            ? "font-extrabold text-white"
            : "font-semibold text-[#1a1a1a] hover:bg-[#f0f4ff] hover:text-[#064db6]"
          }
        `}
        style={isActive ? { background: "#002f73" } : {}}
      >
        <span className={`${depth === 0 ? "text-sm" : "text-xs"} leading-snug`}>
          {item.label}
        </span>
      </button>
      {item.children?.map((child) => (
        <SidebarNavItem
          key={child.id}
          item={child}
          active={active}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

// Main Content Router

function MainContent({ activeNav }: MainContentProps) {
  const contentMap: Record<string, ReactNode> = {
    "faculty-activity":       <FacultyActivityContent />,
    "consultation":           <ConsultationContent />,
    "resource-communication": <ResourceCommunicationContent />,
    "add-announcement":       <AddAnnouncement />,
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
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "Inter, sans-serif" }}>

      <Header
        variant="admin"
        adminName="Admin Account"
        adminRole="SSHS Principal"
        onLogout={() => {
          // TODO: wire to auth logout
          console.log("Logout clicked");
        }}
      />

      <div className="flex flex-1 min-h-0">
        <aside className="shrink-0 flex flex-col bg-white border-r border-[#cbd5e1]" style={{ width: "168px" }}>
          <nav className="flex flex-col pt-4">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                active={activeNav}
                onSelect={setActiveNav}
              />
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8faff]">
          <MainContent activeNav={activeNav} />
        </main>
      </div>
    </div>
  );
}