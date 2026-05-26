const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';
const TOKEN_KEY = 'auth_token';

export interface ConsultationAnalyticsFilters {
  from?: string;
  to?: string;
  faculty?: string;
}

export interface ConsultationPurposeCount {
  label: string;
  count: number;
}

export interface ConsultationAnalyticsResponse {
  efficiency: {
    quickConsultations: number;
    consultationRoom: number;
    avgQueueWaitMin: number;
  };
  cancellationRate: {
    resolved: number;
    scheduleConflict: number;
    longWaitTime: number;
  };
  approvalBottleneck: {
    facultyApprovalMin: number;
    strandHeadApprovalMin: number;
  };
  urgencyPurpose: {
    urgency: { low: number; medium: number; high: number };
    purposes: ConsultationPurposeCount[];
  };
  participants: Array<{
    id: string;
    hashedStudentId: string;
    facultyName: string;
    strand: string;
    consultationUsed: boolean;
    date: string;
    time: string;
    status: "Completed" | "Cancelled" | "No-show";
  }>;
  generatedAt: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQuery(params: ConsultationAnalyticsFilters): string {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.faculty) qs.set('faculty', params.faculty);
  const query = qs.toString();
  return query ? `?${query}` : '';
}

export async function fetchConsultationAnalytics(
  params: ConsultationAnalyticsFilters
): Promise<ConsultationAnalyticsResponse> {
  const res = await fetch(`${BASE_URL}/analytics/consultation${buildQuery(params)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json();
}
