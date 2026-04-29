// frontend/src/pages/adminDashboard.tsx
import { useState, useRef, type ReactNode } from "react";
import AddSchedule from "@/components/ui/admin-dashboard/addSchedule";
import AddAnnouncement from "@/components/ui/admin-dashboard/AddAnnouncement";
import Header from "@/components/ui/header/header";

// ─── Chart Components ─────────────────────────────────────────────────────────
import StatusDistributionChart         from "@/components/ui/admin-dashboard/StatusDistributionChart";
import ConsultationWindowChart         from "@/components/ui/admin-dashboard/ConsulationWindowChart";
import ManualOverrideChart             from "@/components/ui/admin-dashboard/ManualOverrideChart";
import RecencyLogTable                 from "@/components/ui/admin-dashboard/RecencyLogTable";
import ConsultationEfficiencyCard      from "@/components/ui/admin-dashboard/ConsultationEfficiencyCard";
import CancellationRateChart           from "@/components/ui/admin-dashboard/CancellationRateChart";
import ApprovalBottleneckCard          from "@/components/ui/admin-dashboard/ApprovalBottleneckChart";
import RoomOccupancyChart              from "@/components/ui/admin-dashboard/RoomOccupancyChart";
import AnnouncementReachChart          from "@/components/ui/admin-dashboard/AnnouncementReachChart";
import NotificationSuccessChart        from "@/components/ui/admin-dashboard/NotificationSuccessChart";
import UrgencyPurposeAnalysis          from "@/components/ui/admin-dashboard/UrgencyPurposeAnalysis";
import ConsultationParticipantsTable   from "@/components/ui/admin-dashboard/ConsultationParticipantsTable";

// ─── Types ────────────────────────────────────────────────────────────────────
import type {
  ActiveNav,
  SidebarNavItemProps,
  MainContentProps,
} from "@/types/adminDashboard.types";

// ─── Mock Data ────────────────────────────────────────────────────────────────
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
} from "@/data/adminDashboardData";

// ─── Shared Export Helpers ────────────────────────────────────────────────────

/**
 * Triggers a browser print dialog on a specific DOM element.
 * Creates a temporary iframe scoped to just that element so only
 * the analytics section prints (not the whole dashboard).
 */
function printElement(el: HTMLElement, title: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, sans-serif; font-size: 11px; color: #1a1a1a; padding: 24px; }
    h1 { font-size: 15px; font-weight: 800; color: #002f73; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    p  { font-size: 10px; color: #4f4f4f; margin-bottom: 16px; }
    /* Preserve card borders from the captured element */
    canvas { max-width: 100%; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>Printed on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
  ${el.innerHTML}
</body>
</html>`);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    document.body.removeChild(iframe);
  };
}

/**
 * Exports a flat table of key-value pairs as CSV.
 */
function exportAnalyticsCSV(sectionLabel: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${sectionLabel.toLowerCase().replace(/\s+/g, "_")}_analytics.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page Title Banner ────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#002f73] tracking-tight uppercase">
          {title}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── Export Button ────────────────────────────────────────────────────────────

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
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] hover:border-[#064db6] transition-colors"
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

// ─── Page Sections ────────────────────────────────────────────────────────────

function FacultyActivityContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);

  function handleExportCSV() {
    const rows = [
      ["Metric", "Value"],
      ...Object.entries(MOCK_STATUS_DATA).map(([k, v]) => [k, String(v)]),
      ["---", "---"],
      ["Faculty Name", "Strand", "Status", "Last Updated", "Recency"],
      ...MOCK_RECENCY_LOG.map((e) => [e.facultyName, e.strand, e.currentStatus, e.lastUpdated, e.recency]),
    ];
    exportAnalyticsCSV("Faculty Activity", rows);
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Faculty Activity Analytics");
  }

  return (
    <div className="p-6 flex flex-col gap-6 font-[Inter,sans-serif]">
      <PageHeader
        title="Faculty Activity"
        description="Overview of current faculty statuses, consultation windows, and recency updates."
        actions={<ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      />

      <div ref={analyticsRef} className="flex flex-col gap-6">
        {/* Row 1: Status + Consultation Window */}
        <div className="grid grid-cols-2 gap-6">
          <StatusDistributionChart data={MOCK_STATUS_DATA} />
          <ConsultationWindowChart {...MOCK_CONSULTATION_WINDOW} />
        </div>

        {/* Row 2: Recency Log + Manual Override */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <RecencyLogTable entries={MOCK_RECENCY_LOG} />
          </div>
          <ManualOverrideChart {...MOCK_MANUAL_OVERRIDE} />
        </div>
      </div>
    </div>
  );
}

function ConsultationContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);

  function handleExportCSV() {
    const rows = [
      ["Metric", "Value"],
      ["Quick Consultations", String(MOCK_CONSULTATION_EFFICIENCY.quickConsultations)],
      ["Consultation Room",   String(MOCK_CONSULTATION_EFFICIENCY.consultationRoom)],
      ["Avg Queue Wait (min)",String(MOCK_CONSULTATION_EFFICIENCY.avgQueueWaitMin)],
      ["Resolved (%)",        String(MOCK_CANCELLATION_RATE.resolved)],
      ["Schedule Conflict (%)",String(MOCK_CANCELLATION_RATE.scheduleConflict)],
      ["Long Wait Time (%)",  String(MOCK_CANCELLATION_RATE.longWaitTime)],
      ["Faculty Approval (min)",   String(MOCK_APPROVAL_BOTTLENECK.facultyApprovalMin)],
      ["Strand Head Approval (min)",String(MOCK_APPROVAL_BOTTLENECK.strandHeadApprovalMin)],
    ];
    exportAnalyticsCSV("Consultation", rows);
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Consultation Analytics");
  }

  return (
    <div className="p-6 flex flex-col gap-6 font-[Inter,sans-serif]">
      <PageHeader
        title="Consultation"
        description="Demand metrics, cancellation trends, approval bottlenecks, and participant records."
        actions={<ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      />

      <div ref={analyticsRef} className="flex flex-col gap-6">
        {/* Row 1: Efficiency + Cancellation */}
        <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
          <ConsultationEfficiencyCard {...MOCK_CONSULTATION_EFFICIENCY} />
          <CancellationRateChart {...MOCK_CANCELLATION_RATE} />
        </div>

        {/* Row 2: Approval Bottleneck + Urgency Analysis */}
        <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
          <ApprovalBottleneckCard {...MOCK_APPROVAL_BOTTLENECK} />
          <UrgencyPurposeAnalysis />
        </div>
      </div>

      {/* Consultation participants data component not available */}
      <ConsultationParticipantsTable participants={MOCK_CONSULTATION_PARTICIPANTS} />
    </div>
  );
}

function ResourceCommunicationContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);

  function handleExportCSV() {
    const rows = [
      ["Month", "Strand-Specific Reach", "School-Wide Reach"],
      ...MOCK_ANNOUNCEMENT_LABELS.map((label, i) => [
        label,
        String(MOCK_STRAND_SPECIFIC[i]),
        String(MOCK_SCHOOL_WIDE[i]),
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
    ];
    exportAnalyticsCSV("Resource Communication", rows);
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Resource & Communication Analytics");
  }

  return (
    <div className="p-6 flex flex-col gap-6 font-[Inter,sans-serif]">
      <PageHeader
        title="Resource & Communication"
        description="Announcement reach, notification success rates, and room occupancy statistics."
        actions={<ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      />

      <div ref={analyticsRef} className="flex flex-col gap-6">
        {/* Row 1: Notification + Announcement */}
        <div className="grid grid-cols-2 gap-6">
          <NotificationSuccessChart {...MOCK_NOTIFICATION_SUCCESS} />
          <AnnouncementReachChart
            labels={MOCK_ANNOUNCEMENT_LABELS}
            strandSpecific={MOCK_STRAND_SPECIFIC}
            schoolWide={MOCK_SCHOOL_WIDE}
          />
        </div>

        {/* Row 2: Room Occupancy */}
        <RoomOccupancyChart rooms={MOCK_ROOM_OCCUPANCY} />
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

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

// ─── Main Content Router ──────────────────────────────────────────────────────

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

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<ActiveNav>("faculty-activity");

  return (
    <div
      className="min-h-screen flex flex-col bg-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Header — uses the shared Header component ── */}
      <Header
        variant="admin"
        adminName="Admin Account"
        adminRole="SSHS Principal"
        onLogout={() => {
          // TODO: wire to auth logout (e.g. navigate to /login, clear session)
          console.log("Logout clicked");
        }}
      />

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside
          className="shrink-0 flex flex-col bg-white border-r border-[#cbd5e1]"
          style={{ width: "168px" }}
        >
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

        {/* Main */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8faff]">
          <MainContent activeNav={activeNav} />
        </main>

      </div>
    </div>
  );
}