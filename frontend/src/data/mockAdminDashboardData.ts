// frontend/src/data/adminDashboardData.ts
import type { NavItem, RecencyLogEntry } from "@/types/adminDashboard.types";

// Navigation

export const NAV_ITEMS: NavItem[] = [
  { id: "faculty-activity",       label: "Faculty Activity" },
  { id: "consultation",           label: "Consultation" },
  { id: "add-announcement",       label: "Announcement Management" },
  { id: "add-schedule",           label: "Schedule Management" },
  { id: "manage-faculty",         label: "Faculty Management" },
];  

// Faculty Activity

export const MOCK_STATUS_DATA: Record<string, number> = {
  "In Meeting":     6,
  "In Class":       10,
  "On Break":       3,
  "Available":      3,
  "Do Not Disturb": 1,
  "Off Campus":     2,
};

export const MOCK_RECENCY_LOG: RecencyLogEntry[] = [
  { facultyName: "Dela Cruz, Juan", strand: "STEM",  currentStatus: "AVAILABLE",      lastUpdated: "08:30 AM", recency: "Recent" },
  { facultyName: "Santos, Maria",   strand: "ABM",   currentStatus: "IN CLASS",       lastUpdated: "08:45 AM", recency: "Recent" },
  { facultyName: "Reyes, Carlo",    strand: "HUMSS", currentStatus: "ON BREAK",       lastUpdated: "09:00 AM", recency: "Recent" },
  { facultyName: "Garcia, Ana",     strand: "HUMSS", currentStatus: "IN MEETING",     lastUpdated: "09:15 AM", recency: "Recent" },
  { facultyName: "Lopez, Jose",     strand: "STEM",  currentStatus: "OFF CAMPUS",     lastUpdated: "07:50 AM", recency: "Older"  },
  { facultyName: "Mendoza, Clara",  strand: "ABM",   currentStatus: "DO NOT DISTURB", lastUpdated: "09:10 AM", recency: "Recent" },
  { facultyName: "Villanueva, Ed",  strand: "TVL",   currentStatus: "IN CLASS",       lastUpdated: "07:30 AM", recency: "Older"  },
  { facultyName: "Bautista, Liza",  strand: "GAS",   currentStatus: "AVAILABLE",      lastUpdated: "09:20 AM", recency: "Recent" },
];

// Resource & Communication removed from UI; mocks removed

// Consultation

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

export const MOCK_MANUAL_OVERRIDE = { autoStatus: 60, manualOverride: 40 };