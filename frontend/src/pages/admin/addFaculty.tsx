// frontend/src/pages/admin/addFaculty.tsx
import { useState, useEffect } from "react";
import type { FacultyRecord, ImportFacultyResult } from "@/lib/facultyApi";
import { getFacultyList, updateFaculty, deleteFaculty, createFaculty, downloadFacultyTemplate } from "@/lib/facultyApi";
import ImportFacultyModal from "@/components/modal/ImportfacultyModal";
import SelectFilter from "@/components/SelectFilter";

import IconSearch from "@/components/icons/SearchIcon";
import IconEdit from "@/components/icons/EditIcon";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Constants ──────────────────────────────────────────────────────────────────

const STRANDS      = ["All Strands", "STEM", "ABM", "HUMSS"];
const ROWS_PER_PAGE = 10;

type AllowedRole = "faculty" | "strand_head" | "principal";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Flat shape used by the table rows */
interface FacultyRow {
  id:       string;
  facultyId: string;
  name:     string;
  email:    string;
  strand:   string;
  role:     AllowedRole;
  subjects: string;
  subjectsArray: string[];
  currentStatus: string;
  currentRoom: string;
}

/** Editable fields — facultyId is intentionally absent */
interface EditDraft {
  name:     string;
  email:    string;
  strand:   string;
  role:     AllowedRole;
  subjects: string; // comma-separated in the form, parsed on submit
}

type AddDraft = EditDraft; // for quick reference

// ── Converters ────────────────────────────────────────────────────────────────

function toRow(f: FacultyRecord): FacultyRow {
  return {
    id:            f.id,
    facultyId:     f.facultyId ?? "—",
    name:          f.name,
    email:         f.email ?? "—",
    strand:        f.strand ?? "—",
    role:          (f.role as AllowedRole) ?? "faculty",
    subjects:      f.subjects.length ? f.subjects.join(", ") : "—",
    subjectsArray: f.subjects,
    currentStatus: f.currentStatus,
    currentRoom:   f.currentRoom ?? "TBD",
  };
}

// ── Small reusable form field ─────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`border border-gray-200 px-3 py-2 text-sm rounded outline-none focus:border-[#002f73] transition-colors ${
          readOnly ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white text-gray-800"
        }`}
      />
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditFacultyModal({
  row,
  onClose,
  onSaved,
  onDeleted,
}: {
  row: FacultyRow;
  onClose: () => void;
  onSaved: (updated: FacultyRow) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState<EditDraft>({
    name:     row.name,
    email:    row.email === "—" ? "" : row.email,
    strand:   row.strand === "—" ? "" : row.strand,
    role:     row.role,
    subjects: row.subjectsArray.join(", "),
  });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function set<K extends keyof EditDraft>(key: K, val: EditDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const subjectsArray = draft.subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!subjectsArray.length) { setError("At least one subject is required."); setSaving(false); return; }

      const updated = await updateFaculty(row.id, {
        name:     draft.name,
        email:    draft.email,
        strand:   draft.strand,
        role:     draft.role,
        subjects: subjectsArray,
      });

      onSaved(toRow(updated));
    } catch (e) {
      setError(e instanceof Error ? e.message :  "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteFaculty(row.id);
      onDeleted(row.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete faculty.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md shadow-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#002f73] uppercase tracking-tight">Edit Faculty</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* facultyId — read-only, shown for reference */}
        <Field label="Faculty ID" value={row.facultyId} readOnly />

        <Field label="Name"   value={draft.name}  onChange={(v) => set("name",  v)} required />
        <Field label="Email"  value={draft.email} onChange={(v) => set("email", v)} type="email" required />
        <Field label="Strand" value={draft.strand} onChange={(v) => set("strand", v)} required />

        {/* Role select */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Role<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={draft.role}
            onChange={(e) => set("role", e.target.value as AllowedRole)}
            className="border border-gray-200 px-3 py-2 text-sm rounded outline-none focus:border-[#002f73] bg-white text-gray-800"
          >
            <option value="faculty">Faculty</option>
            <option value="strand_head">Strand Head</option>
            <option value="principal">Principal</option>
          </select>
        </div>

        <Field
          label="Subjects (comma-separated)"
          value={draft.subjects}
          onChange={(v) => set("subjects", v)}
          required
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-semibold">Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50"
            >
              Delete Faculty
            </button>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#002f73] hover:bg-[#064db6] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Faculty modal (single entry) ─────────────────────────────────────────

function AddFacultyModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (row: FacultyRow) => void;
}) {
  const [draft, setDraft] = useState<AddDraft>({
    name:     "",
    email:    "",
    strand:   "",
    role:     "faculty",
    subjects: "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function set<K extends keyof AddDraft>(key: K, val: AddDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function handleAdd() {
    setError(null);
    const subjectsArray = draft.subjects.split(",").map((s) => s.trim()).filter(Boolean);
    if (!draft.name)  { setError("Name is required."); return; }
    if (!draft.email) { setError("Email is required."); return; }
    if (!draft.strand){ setError("Strand is required."); return; }
    if (!subjectsArray.length) { setError("At least one subject is required."); return; }

    setSaving(true);
    try {
      const created = await createFaculty({
        name:     draft.name,
        email:    draft.email,
        strand:   draft.strand,
        role:     draft.role,
        subjects: subjectsArray,
      });
      onAdded(toRow(created));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create faculty.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md shadow-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#002f73] uppercase tracking-tight">Add Faculty</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <p className="text-xs text-gray-400">Faculty ID will be generated automatically (e.g. FAC-DELA CRUZ).</p>

        <Field label="Full Name" value={draft.name}  onChange={(v) => set("name",  v)} required />
        <Field label="Email"     value={draft.email} onChange={(v) => set("email", v)} type="email" required />
        <Field label="Strand"    value={draft.strand} onChange={(v) => set("strand", v)} required />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Role<span className="text-red-500 ml-0.5">*</span></label>
          <select
            value={draft.role}
            onChange={(e) => set("role", e.target.value as AllowedRole)}
            className="border border-gray-200 px-3 py-2 text-sm rounded outline-none focus:border-[#002f73] bg-white text-gray-800"
          >
            <option value="faculty">Faculty</option>
            <option value="strand_head">Strand Head</option>
            <option value="principal">Principal</option>
          </select>
        </div>

        <Field
          label="Subjects (comma-separated)"
          value={draft.subjects}
          onChange={(v) => set("subjects", v)}
          required
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#002f73] hover:bg-[#064db6] disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add Faculty"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export default function AddFaculty() {
  const [rows,          setRows]          = useState<FacultyRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [strandFilter,  setStrandFilter]  = useState("All Strands");
  const [search,        setSearch]        = useState("");
  const [page,          setPage]          = useState(1);
  const [isImporting,   setIsImporting]   = useState(false);
  const [isAdding,      setIsAdding]      = useState(false);
  const [lastImport,    setLastImport]    = useState<ImportFacultyResult | null>(null);

  const [templateLoading, setTemplateLoading] = useState(false);

  async function handleDownloadTemplate() {
    setTemplateLoading(true);
    try {
      await downloadFacultyTemplate();
    } finally {
      setTemplateLoading(false);
    }
  }
  const [editTarget,    setEditTarget]    = useState<FacultyRow | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    getFacultyList()
      .then((res) => setRows(res.data.map(toRow)))
      .catch(() => {/* keep empty — user will see "No faculty found" */})
      .finally(() => setLoading(false));
  }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const matchStrand = strandFilter === "All Strands" || r.strand === strandFilter;
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      r.name.toLowerCase().includes(q) ||
      r.facultyId.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.subjects.toLowerCase().includes(q);
    return matchStrand && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string) => { setter(value); setPage(1); };
  }

  function handleImportSuccess(result: ImportFacultyResult) {
    setLastImport(result);
    if (result.status !== "failed") {
      getFacultyList()
        .then((res) => setRows(res.data.map(toRow)))
        .catch(() => {});
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <section className="min-h-screen w-full bg-gray-50 p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#002f73] uppercase">
              Manage Faculty
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              View, add, and manage faculty members for the SHS Faculty Board.
            </p>
          </div>

          <div className="flex gap-2">
            {/* Download template */}
            <button
              onClick={handleDownloadTemplate}
              disabled={templateLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-[#002f73] border border-[#cbd5e1] hover:bg-[#f0f4ff] hover:border-[#002f73] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {templateLoading ? 'Generating…' : 'Download Template'}
            </button>
            
            {/* Single add */}
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-[#002f73] border border-[#002f73] hover:bg-blue-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Faculty
            </button>

            {/* Bulk import */}
            <button
              onClick={() => setIsImporting(true)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white border border-[#002f73] bg-[#002f73] hover:bg-[#064db6] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import Faculty
            </button>
          </div>
        </div>

        {/* Import result banner */}
        {lastImport && (
          <div
            className="mb-4 px-4 py-2.5 border text-xs font-semibold flex items-center justify-between"
            style={{
              background:   lastImport.status === "failed" ? "#fde8e7" : "#e6f9ec",
              borderColor:  lastImport.status === "failed" ? "#ed3a30" : "#31ac52",
              color:        lastImport.status === "failed" ? "#ed3a30" : "#31ac52",
            }}
          >
            <span>
              Last import: {lastImport.recordsCreated} created, {lastImport.recordsUpdated} updated
              {lastImport.errors.length > 0 && `, ${lastImport.errors.length} error(s)`}
            </span>
            <button onClick={() => setLastImport(null)} className="ml-4 font-bold opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Table card */}
        <div className="bg-white shadow-sm border border-gray-100 overflow-hidden">

          {/* Filters */}
          <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
            <SelectFilter
              value={strandFilter}
              onChange={handleFilterChange(setStrandFilter)}
              options={STRANDS}
            />
            <div className="flex items-center border border-gray-200 px-3 py-2 bg-white flex-1 min-w-40 gap-2">
              <IconSearch />
              <input
                type="text"
                placeholder="Search by name, ID, email, or subject…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-0">
                  {["Faculty ID", "Name", "Email", "Strand", "Role", "Subjects", "Actions"].map((h) => (
                    <TableHead
                      key={h}
                      className="text-white font-bold text-xs uppercase tracking-wider whitespace-nowrap py-3 px-4"
                      style={{ background: "#002f73" }}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      No faculty found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((f, i) => (
                    <TableRow
                      key={f.id}
                      className="border-b border-gray-50 hover:bg-blue-50/40 transition-colors"
                      style={{ background: i % 2 === 0 ? "#ffffff" : "#f8faff" }}
                    >
                      {/* Faculty ID */}
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-[#002f73] bg-blue-50 px-2 py-0.5 rounded">
                          {f.facultyId}
                        </span>
                      </TableCell>

                      {/* Name */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: "#002f73" }}
                          >
                            {f.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                          <span className="font-semibold text-[#1a1a1a] text-sm whitespace-nowrap">{f.name}</span>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="px-4 py-3 text-gray-600 text-sm">{f.email}</TableCell>

                      {/* Strand */}
                      <TableCell className="px-4 py-3 font-semibold text-[#002f73] text-sm">{f.strand}</TableCell>

                      {/* Role */}
                      <TableCell className="px-4 py-3 text-gray-600 text-sm capitalize">
                        {f.role.replace("_", " ")}
                      </TableCell>

                      {/* Subjects */}
                      <TableCell className="px-4 py-3 text-sm max-w-[200px]">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="block truncate text-gray-600 cursor-default max-w-[200px]">
                              {f.subjects}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[280px] text-xs leading-relaxed"
                          >
                            <div className="flex flex-col gap-1">
                               {f.subjectsArray.length > 0
                                  ? f.subjectsArray.map((s, i) => (
                                      <div key={i} className="py-0.5">{s}</div>
                                    ))
                                  : <span className="text-gray-400">No subjects</span>
                                }
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditTarget(f)}
                            className="p-1.5 hover:bg-blue-100 text-[#002f73] transition-colors"
                            title="Edit faculty"
                          >
                            <IconEdit />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Showing{" "}
              {filtered.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1} –{" "}
              {Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 text-xs font-semibold transition-colors ${
                    pg === page ? "bg-[#002f73] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {isAdding && (
          <AddFacultyModal
            onClose={() => setIsAdding(false)}
            onAdded={(row) => { setRows((prev) => [row, ...prev]); setIsAdding(false); }}
          />
        )}

        {isImporting && (
          <ImportFacultyModal
            onClose={() => setIsImporting(false)}
            onSuccess={(result) => { handleImportSuccess(result); setIsImporting(false); }}
          />
        )}

        {editTarget && (
          <EditFacultyModal
            row={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={(updated) => {
              setRows((prev) => prev.map((r) => r.id === updated.id ? updated : r));
              setEditTarget(null);
            }}
            onDeleted={(id) => {
              setRows((prev) => prev.filter((r) => r.id !== id));
              setEditTarget(null);
            }}
          />
        )}
      </section>
    </TooltipProvider>
  );
}