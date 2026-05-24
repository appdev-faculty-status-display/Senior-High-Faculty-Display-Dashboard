// frontend/src/lib/facultyApi.ts

import type { FacultyStatus, Strands } from "@/types/faculty-states";

const BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';
const TOKEN_KEY = 'auth_token';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FacultyRecord {
  id: string;
  name: string;
  strand: Strands;
  role: string;
  currentStatus: FacultyStatus;
  currentRoom: string;
  subjects: string[];
  consultationHours: { day: string; startTime: string; endTime: string }[];
  schedule: { day: string; startTime: string; endTime: string; subject: string; room: string }[];
  updatedAt: string;
}

export interface FacultyListResponse {
  data: FacultyRecord[];
  total: number;
}

export interface ImportFacultyResult {
  importId: string;
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: { row: number; field: string; message: string }[];
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw data as ApiError;
  return data as T;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function getFacultyList(strand?: string): Promise<FacultyListResponse> {
  const params = strand ? `?strand=${encodeURIComponent(strand)}` : '';
  const res = await fetch(`${BASE_URL}/faculty${params}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<FacultyListResponse>(res);
}

export async function importFaculty(
  file: File,
  replaceSchedule: boolean
): Promise<ImportFacultyResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('replaceSchedule', String(replaceSchedule));

  const res = await fetch(`${BASE_URL}/faculty/import`, {
    method: 'POST',
    headers: getAuthHeaders(), // no Content-Type — browser sets it for FormData
    body: formData,
  });
  return handleResponse<ImportFacultyResult>(res);
}