// frontend/src/lib/facultyApi.ts
import ExcelJS from "exceljs";
import type { ConsultationHours, ScheduleEntry } from "@/types/faculty-states";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const BASE = (import.meta.env.VITE_API_URL || 'https://facultyboard-cqdzg5a8dwccegby.japaneast-01.azurewebsites.net');

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FacultyRecord {
  id:            string;
  facultyId:     string;     // e.g. "FAC-DELACRUZ"
  name:          string;
  email:         string | null;
  strand:        string | null;
  role:          string;
  currentStatus: string;
  currentRoom:   string | null;
  subjects:      string[];
  consultationHours: ConsultationHours[];
  schedule:      ScheduleEntry[];
  updatedAt:     string;
}

export interface ImportFacultyResult {
  importId:         string;
  status:           'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsCreated:   number;
  recordsUpdated:   number;
  errors:           { row: number; field: string; message: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      msg = body.message ?? msg;
    } catch {
      // ignore JSON parse errors and use default message
    }
    throw new Error(msg);
  }  
  return res.json() as Promise<T>;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getFacultyList(strand?: string): Promise<{ data: FacultyRecord[]; total: number }> {
  const qs = strand ? `?strand=${encodeURIComponent(strand)}` : '';
  const res = await fetch(`${BASE}/api/faculty${qs}`);
  return handleResponse(res);
}

export async function getFacultyListAdmin(strand?: string): Promise<{ data: FacultyRecord[]; total: number }> {
  const qs = strand ? `?strand=${encodeURIComponent(strand)}` : '';
  const res = await fetchWithAuth(`${BASE}/api/faculty/manage${qs}`);
  return handleResponse(res);
}

export async function getFacultyById(id: string): Promise<FacultyRecord> {
  const res = await fetch(`${BASE}/api/faculty/${id}`);
  return handleResponse(res);
}

export interface CreateFacultyPayload {
  name:     string;
  email:    string;
  strand:   string;
  role:     string;
  subjects: string[];
  currentRoom?:     string;
  teamsWebhookUrl?: string;
}

export async function createFaculty(payload: CreateFacultyPayload): Promise<FacultyRecord> {
  const res = await fetchWithAuth(`${BASE}/api/faculty`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...payload, subjects: JSON.stringify(payload.subjects) }),
  });
  return handleResponse(res);
}

export interface UpdateFacultyPayload {
  name?:     string;
  email?:    string;
  strand?:   string;
  role?:     string;
  subjects?: string[];
  currentRoom?:     string;
  teamsWebhookUrl?: string;
}

export async function updateFaculty(id: string, payload: UpdateFacultyPayload): Promise<FacultyRecord> {
  // subjects must be serialized as JSON string for multipart-compatible middleware,
  // but since this route uses upload.none() we can send plain JSON.
  const body: Record<string, unknown> = { ...payload };
  if (payload.subjects) body.subjects = JSON.stringify(payload.subjects);

  const res = await fetchWithAuth(`${BASE}/api/faculty/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function deleteFaculty(id: string): Promise<{ id: string; facultyId: string; deleted: boolean }> {
  const res = await fetchWithAuth(`${BASE}/api/faculty/${id}`, {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res);
}

export async function importFaculty(
  file: File,
  replaceSchedule = false
): Promise<ImportFacultyResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('replaceSchedule', String(replaceSchedule));

  const res = await fetchWithAuth(`${BASE}/api/faculty/import`, {
    method:  'POST',
    headers: {},    // DO NOT set Content-Type — let the browser set multipart boundary
    body:    form,
  });
  return handleResponse(res);
}

// Template Download
export async function downloadFacultyTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Senior High Faculty Display Dashboard";
  workbook.created = new Date();

  const templateSheet = workbook.addWorksheet("Faculty Import");
  templateSheet.columns = [
    { header: "name", key: "name", width: 24 },
    { header: "email", key: "email", width: 30 },
    { header: "userId", key: "userId", width: 18 },
    { header: "strand", key: "strand", width: 14 },
    { header: "role", key: "role", width: 16 },
    { header: "subjects", key: "subjects", width: 30 },
    { header: "schedule", key: "schedule", width: 60 },
  ];
  templateSheet.getRow(1).font = { bold: true };
  templateSheet.addRow({
    name: "Juan Dela Cruz",
    email: "jdelacruz@school.edu",
    userId: "jdelacruz",
    strand: "STEM",
    role: "faculty",
    subjects: '["Math", "Science"]',
    schedule: '[{"day":"Monday","startTime":"07:30","endTime":"09:00","subject":"Math","room":"101"}]',
  });

  const instructionsSheet = workbook.addWorksheet("Instructions");
  instructionsSheet.columns = [
    { header: "Field", key: "field", width: 18 },
    { header: "Requirement", key: "requirement", width: 18 },
    { header: "Example", key: "example", width: 36 },
    { header: "Notes", key: "notes", width: 72 },
  ];
  instructionsSheet.getRow(1).font = { bold: true };
  instructionsSheet.addRows([
    {
      field: "subjects",
      requirement: "Required",
      example: '["Math", "Science"]',
      notes: "Must be a JSON array string with at least one subject.",
    },
    {
      field: "schedule",
      requirement: "Optional",
      example: '[{"day":"Monday","startTime":"07:30","endTime":"09:00","subject":"Math","room":"101"}]',
      notes: "Use a JSON array string when you want to include schedule rows.",
    },
    {
      field: "role",
      requirement: "Required",
      example: "faculty",
      notes: "Allowed values: faculty, strand_head, principal.",
    },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "faculty_import_template.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
