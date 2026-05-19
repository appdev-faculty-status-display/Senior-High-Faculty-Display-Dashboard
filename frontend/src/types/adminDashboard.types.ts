// frontend/src/types/adminDashboard.types.ts

// Navigation
import type { Status } from "@/types/schedule";

export type NavItem = {
  id: string;
  label: string;
  children?: NavItem[];
};

export type ActiveNav = string;

// RecencyLogTable

export interface RecencyLogEntry {
  facultyName: string;
  strand: string;
  currentStatus: Status;
  lastUpdated: string;
  recency: string;
}

// RoomOccupancyChart

export interface RoomData {
  room: string;
  used: number;
  available: number;
}

// ConsultationParticipantsTable

export interface ConsultationParticipant {
  id: number;
  hashedStudentId: string;
  facultyName: string;
  strand: string;
  consultationUsed: boolean;
  date: string;
  time: string;
  status: "Completed" | "Cancelled" | "No-show";
}

// Chart Component Props 

export interface AnnouncementReachChartProps {
  labels: string[];
  strandSpecific: number[];
  schoolWide: number[];
}

export interface ApprovalBottleneckCardProps {
  facultyApprovalMin: number;
  strandHeadApprovalMin: number;
}

export interface CancellationRateChartProps {
  resolved: number;
  scheduleConflict: number;
  longWaitTime: number;
}

export interface ConsultationWindowChartProps {
  activeLabels: string[];
  activeWindows: number[];
  durationLabels: string[];
  avgDuration: number[];
}

export interface ConsultationEfficiencyCardProps {
  quickConsultations: number;
  consultationRoom: number;
  avgQueueWaitMin: number;
}

export interface ManualOverrideChartProps {
  autoStatus: number;
  manualOverride: number;
}

export interface NotificationSuccessChartProps {
  labels: string[];
  sent: number[];
  failed: number[];
}

export interface RecencyLogTableProps {
  entries: RecencyLogEntry[];
}

export interface RoomOccupancyChartProps {
  rooms: RoomData[];
}

export interface StatusDistributionChartProps {
  data: Record<string, number>;
}

// ─── Sub-component Props ──────────────────────────────────────────────────────

export interface AdminAvatarProps {
  name: string;
  role: string;
}

export interface SidebarNavItemProps {
  item: NavItem;
  active: ActiveNav;
  onSelect: (id: string) => void;
  depth?: number;
}

export interface MainContentProps {
  activeNav: ActiveNav;
}