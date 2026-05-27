// frontend/src/lib/facultyApi.ts

const BASE = import.meta.env.VITE_API_URL ?? '';

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
  consultationHours: { day: string; startTime: string; endTime: string }[];
  schedule:      unknown[];
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

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

export async function getFacultyById(id: string): Promise<FacultyRecord> {
  const res = await fetch(`${BASE}/api/faculty/${id}`, {
    headers: authHeaders(),
  });
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
  const res = await fetch(`${BASE}/api/faculty`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
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

  const res = await fetch(`${BASE}/api/faculty/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function deleteFaculty(id: string): Promise<{ id: string; facultyId: string; deleted: boolean }> {
  const res = await fetch(`${BASE}/api/faculty/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
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

  const res = await fetch(`${BASE}/api/faculty/import`, {
    method:  'POST',
    headers: authHeaders(),    // DO NOT set Content-Type — let the browser set multipart boundary
    body:    form,
  });
  return handleResponse(res);
}

// Template Download
export async function downloadFacultyTemplate(): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
 
  const workbook  = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Faculty Import');
 
  // Column definitions with widths
  worksheet.columns = [
    { header: 'name',     key: 'name',     width: 25 },
    { header: 'email',    key: 'email',    width: 30 },
    { header: 'userId',   key: 'userId',   width: 20 },
    { header: 'strand',   key: 'strand',   width: 12 },
    { header: 'role',     key: 'role',     width: 14 },
    { header: 'subjects', key: 'subjects', width: 35 },
    { header: 'schedule', key: 'schedule', width: 80 },
  ];
 
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002F73' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
 
  // Example data row
  worksheet.addRow({
    name:     'Juan Dela Cruz',
    email:    'jdelacruz@school.edu',
    userId:   'jdelacruz',
    strand:   'STEM',
    role:     'faculty',
    subjects: '["Math","Science"]',
    schedule: '[{"day":"Monday","startTime":"07:30","endTime":"09:00","subject":"Math","room":"101"}]',
  });
 
  // Trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = 'faculty_import_template.xlsx';
  link.click();
  URL.revokeObjectURL(url);
}
