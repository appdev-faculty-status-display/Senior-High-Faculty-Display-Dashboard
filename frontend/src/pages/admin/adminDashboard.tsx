// frontend/src/pages/admin/adminDashboard.tsx
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import AddSchedule    from "@/components/ui/admin-dashboard/addSchedule";
import AddFaculty     from "@/pages/admin/addFaculty";
import Header         from "@/components/ui/header/header";
import AddAnnouncement from "@/pages/admin/announcementPage";
import { DateRangePicker } from "@/components/ui/admin-dashboard/DatePicker";

// Chart Components
import StatusDistributionChart       from "@/components/ui/admin-dashboard/StatusDistributionChart";
import RecencyLogTable               from "@/components/ui/admin-dashboard/RecencyLogTable";
import ConsultationEfficiencyCard    from "@/components/ui/admin-dashboard/ConsultationEfficiencyCard";
import UrgencyPurposeAnalysis        from "@/components/ui/admin-dashboard/UrgencyPurposeAnalysis";

// Types
import type { ActiveNav, SidebarNavItemProps, MainContentProps, ConsultationEfficiencyCardProps, RecencyLogEntry } from "@/types/adminDashboard.types";
import type { ConsultationResponse, FacultyActivityResponse } from "@/lib/analyticsApi";

// Mock Data 
import { NAV_ITEMS, MOCK_STATUS_DATA, MOCK_RECENCY_LOG, MOCK_CONSULTATION_EFFICIENCY } from "@/data/mockAdminDashboardData";

// Utils
import { downloadCSV }  from "@/utils/csvEscapeHelper";
import { printElement } from "@/utils/pdfExportHelper";
import * as analyticsApi from '../../lib/analyticsApi';

// Hooks
import { useAuth } from "@/hooks/useAuth";

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

// Shared: Page Header

interface PageHeaderProps {
  title: string;
  description: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

function PageHeader({ title, description, filters, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
      <div className="shrink-0">
        <h2 className="text-2xl font-extrabold text-[#002f73] tracking-tight uppercase leading-tight">
          {title}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {filters}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// Page: Faculty Activity 
// Global filter: date range only

function FacultyActivityContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [statusData, setStatusData] = useState<Record<string, number>>(MOCK_STATUS_DATA);
  const [recencyLog, setRecencyLog] = useState<RecencyLogEntry[]>(MOCK_RECENCY_LOG);

  function handleExportCSV() {
    downloadCSV(
      [
        ["Metric", "Value"],
        ...Object.entries(statusData).map(([k, v]) => [k, String(v)]),
        ["---", "---"],
        ["Faculty Name", "Strand", "Status", "Last Updated", "Recency"],
        ...recencyLog.map((e) => [e.facultyName, e.strand, e.currentStatus, e.lastUpdated, e.recency]),
      ],
      "faculty_activity_analytics"
    );
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Faculty Activity Analytics");
  }

  useEffect(() => {
    let mounted = true;
    analyticsApi.getFacultyActivity({ from: dateFrom || undefined, to: dateTo || undefined })
      .then((data: FacultyActivityResponse) => {
        if (!mounted) return;
        if (data.statusDistribution) setStatusData(data.statusDistribution);
        if (data.recencyLog) setRecencyLog(data.recencyLog);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [dateFrom, dateTo]);

  return (
    <div className="p-6 flex flex-col gap-6 font-sans">
      <PageHeader
        title="Faculty Activity"
        description="Overview of faculty statuses, consultation windows, and recency updates."
        filters={
          <DateRangePicker
            from={dateFrom} to={dateTo}
            onFromChange={setDateFrom} onToChange={setDateTo}
          />
        }
        actions={<ExportButtons onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />}
      />

      <div ref={analyticsRef} className="flex flex-col gap-6">
        {/* Row 1: Status */}
        <div className="grid grid-cols-1 gap-6">
          <StatusDistributionChart data={statusData} />
        </div>

        {/* Row 2: Recency Log full width — local filters: faculty, strand, status */}
        <RecencyLogTable
          entries={recencyLog}
          globalTimeFrom={dateFrom}
          globalTimeTo={dateTo}
        />
      </div>
    </div>
  );
}

// Page: Consultation
// Global filter: date range + faculty name search

function ConsultationContent() {
  const analyticsRef = useRef<HTMLDivElement>(null);
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [consultationEfficiency, setConsultationEfficiency] = useState<ConsultationEfficiencyCardProps>(MOCK_CONSULTATION_EFFICIENCY);

  function handleExportCSV() {
    downloadCSV(
      [
        ["Metric", "Value"],
        ["Quick Consultations",        String(consultationEfficiency.quickConsultations)],
        ["Consultation Room",          String(consultationEfficiency.consultationRoom)],
      ],
      "consultation_analytics"
    );
  }

  function handleExportPDF() {
    if (analyticsRef.current) printElement(analyticsRef.current, "Consultation Analytics");
  }

  useEffect(() => {
    let mounted = true;
    analyticsApi.getConsultation({ from: dateFrom || undefined, to: dateTo || undefined, faculty: facultySearch || undefined })
      .then((data: ConsultationResponse) => {
        if (!mounted) return;
        if (data.consultationEfficiency) setConsultationEfficiency(data.consultationEfficiency);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [dateFrom, dateTo, facultySearch]);

  return (
    <div className="p-6 flex flex-col gap-6 font-sans">
      <PageHeader
        title="Consultation"
        description="Demand metrics, cancellation trends, approval bottlenecks, and participant records."
        filters={
          <div className="flex items-center gap-2">
            <DateRangePicker
              from={dateFrom} to={dateTo}
              onFromChange={setDateFrom} onToChange={setDateTo}
            />
            {/* Faculty name global filter */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4f4f4f]"
                width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
          <ConsultationEfficiencyCard {...consultationEfficiency} />
          <UrgencyPurposeAnalysis />
        </div>
      </div>
      {/* Note: Participants table removed per updated analytics requirements */}
    </div>
  );
}

// Page: Resource & Communication
// Global filter: date range + strand

// Resource & Communication page removed per analytics scope change

// Sidebar Nav Item

function SidebarNavItem({ item, active, onSelect, depth = 0 }: SidebarNavItemProps) {
  const isActive = active === item.id;
  return (
    <>
      <button
        onClick={() => onSelect(item.id)}
        className={`
          w-full text-left transition-all duration-150 select-none font-sans
          ${depth === 0 ? "px-5 py-3" : "px-7 py-2.5"}
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
    "add-announcement":       <AddAnnouncement />,
    "add-schedule":           <AddSchedule />,
    "manage-faculty":         <AddFaculty />,
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
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  }

  const rawRole = user?.role || "";
  const formattedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
  
  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "Inter Variable, sans-serif" }}>

      {/* Uses the existing shared Header component */}
      <Header
        variant="admin"
        adminName={user?.name || ''}
        adminRole={formattedRole}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 min-h-0">

        {/* Sidebar — wider at 220px */}
        <aside
          className="shrink-0 flex flex-col bg-white border-r border-[#cbd5e1]"
          style={{ width: "220px" }}
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

        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8faff]">
          <MainContent activeNav={activeNav} />
        </main>

      </div>
    </div>
  );
}