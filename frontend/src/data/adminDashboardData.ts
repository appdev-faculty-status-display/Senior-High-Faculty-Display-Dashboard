// frontend/src/data/adminDashboardData.ts

import type { NavItem, RecencyLogEntry, RoomData } from "@/types/adminDashboard.types";

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS: NavItem[] = [
  { id: "faculty-activity",       label: "Faculty Activity" },
  { id: "consultation",           label: "Consultation" },
  { id: "resource-communication", label: "Resource & Communication" },
  { id: "add-announcement",       label: "Add Announcement" },
  { id: "add-schedule",           label: "Add Schedule" },
];

// ─── Faculty Activity ─────────────────────────────────────────────────────────

export const MOCK_STATUS_DATA: Record<string, number> = {
  "In Meeting":      6,
  "In Class":        10,
  "On Break":        3,
  "Available":       3,
  "Do Not Disturb":  1,
  "Off Campus":      2,
};

export const MOCK_RECENCY_LOG: RecencyLogEntry[] = [
  { facultyName: "Dela Cruz, Juan", strand: "STEM",  currentStatus: "Available",      lastUpdated: "08:30 AM", recency: "Recent" },
  { facultyName: "Santos, Maria",   strand: "ABM",   currentStatus: "In Class",       lastUpdated: "08:45 AM", recency: "Recent" },
  { facultyName: "Reyes, Carlo",    strand: "HUMSS", currentStatus: "On Break",       lastUpdated: "09:00 AM", recency: "Recent" },
  { facultyName: "Garcia, Ana",     strand: "HUMSS", currentStatus: "In Meeting",     lastUpdated: "09:15 AM", recency: "Recent" },
  { facultyName: "Lopez, Jose",     strand: "STEM",  currentStatus: "Off Campus",     lastUpdated: "07:50 AM", recency: "Older"  },
  { facultyName: "Mendoza, Clara",  strand: "ABM",   currentStatus: "Do Not Disturb", lastUpdated: "09:10 AM", recency: "Recent" },
];

// ─── Resource & Communication ─────────────────────────────────────────────────

export const MOCK_ANNOUNCEMENT_LABELS: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
export const MOCK_STRAND_SPECIFIC: number[]      = [10, 20, 15, 30, 25, 40];
export const MOCK_SCHOOL_WIDE: number[]          = [5,  15, 30, 50, 70, 85];

export const MOCK_ROOM_OCCUPANCY: RoomData[] = [
  { room: "Room 1", used: 57.1, available: 42.9 },
  { room: "Room 2", used: 58.3, available: 41.7 },
  { room: "Room 3", used: 69.2, available: 30.8 },
];

// ─── Consultation ─────────────────────────────────────────────────────────────

export const MOCK_CONSULTATION_WINDOW = {
  activeLabels:   ["Dr. A", "Prof. B", "Prof. A", "Prof. N"],
  activeWindows:  [8, 6, 3, 1],
  durationLabels: ["Prof. A", "Prof. B", "Prof. C", "Prof. D", "Prof. E"],
  avgDuration:    [30, 25, 18, 15, 22],
};

export const MOCK_CONSULTATION_EFFICIENCY = {
  quickConsultations: 60,
  consultationRoom:   40,
  avgQueueWaitMin:    14,
};

export const MOCK_CANCELLATION_RATE = {
  resolved:         6.5,
  scheduleConflict: 26,
  longWaitTime:     64.9,
};

export const MOCK_APPROVAL_BOTTLENECK = {
  facultyApprovalMin:    8,
  strandHeadApprovalMin: 12,
};

export const MOCK_MANUAL_OVERRIDE = {
  autoStatus:     60,
  manualOverride: 40,
};

export const MOCK_NOTIFICATION_SUCCESS = {
  labels: ["Teams", "Email"],
  sent:   [40, 30],
  failed: [34, 18],
};