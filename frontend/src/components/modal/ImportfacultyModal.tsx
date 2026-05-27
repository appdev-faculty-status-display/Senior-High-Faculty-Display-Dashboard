// frontend/src/components/modal/ImportFacultyModal.tsx
import { useRef, useState } from "react";
import { importFaculty } from "@/lib/facultyApi";
import type { ImportFacultyResult } from "@/lib/facultyApi";

interface Props {
  onClose: () => void;
  onSuccess: (result: ImportFacultyResult) => void;
}

export default function ImportFacultyModal({ onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceSchedule, setReplaceSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportFacultyResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      setError('Only .xlsx files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    setError(null);
    setSelectedFile(file);
  }

  async function handleImport() {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await importFaculty(selectedFile, replaceSchedule);
      setResult(res);
      onSuccess(res);
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      setError(apiErr?.error ?? 'Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Result view ──────────────────────────────────────────────────────────────
  if (result) {
    const statusColor =
      result.status === 'success' ? '#31ac52' :
      result.status === 'partial' ? '#ff914d' : '#ed3a30';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white shadow-lg w-full max-w-lg p-8 border border-gray-100">
          <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
            Import Results
          </h2>
          <div className="border-b-2 border-yellow-400 mb-6" />

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Processed', value: result.recordsProcessed, color: '#064db6' },
              { label: 'Created',   value: result.recordsCreated,   color: '#31ac52' },
              { label: 'Updated',   value: result.recordsUpdated,   color: '#ff914d' },
            ].map((s) => (
              <div key={s.label} className="border border-[#cbd5e1] p-3 text-center">
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] font-bold text-[#4f4f4f] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          <div
            className="text-xs font-bold px-3 py-1.5 mb-4 inline-block"
            style={{ background: `${statusColor}18`, color: statusColor }}
          >
            Status: {result.status.toUpperCase()}
            {result.errors.length > 0 && ` — ${result.errors.length} row error(s)`}
          </div>

          {/* Error table */}
          {result.errors.length > 0 && (
            <div className="border border-[#e8edf5] overflow-x-auto mb-5 max-h-40 overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: "#002f73" }}>
                    {["Row", "Field", "Message"].map((h) => (
                      <th key={h} className="text-left text-white font-bold px-3 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i} className="border-b border-[#f0f4ff]" style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                      <td className="px-3 py-1.5 font-mono text-[#064db6] font-bold">{e.row}</td>
                      <td className="px-3 py-1.5 text-[#4f4f4f]">{e.field}</td>
                      <td className="px-3 py-1.5 text-[#1a1a1a]">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[11px] font-bold text-white bg-[#002f73] hover:bg-[#064db6] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload view ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white shadow-lg w-full max-w-md p-8 border border-gray-100">
        <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
          Import Faculty
        </h2>
        <div className="border-b-2 border-yellow-400 mb-6" />

        {/* Drop zone */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-yellow-400 p-10 cursor-pointer hover:bg-yellow-50 transition-colors mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
          <svg
            className="w-12 h-12 mb-3"
            style={{ color: "#002f73" }}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
          </svg>
          {selectedFile ? (
            <span className="font-bold text-sm text-[#31ac52]">{selectedFile.name}</span>
          ) : (
            <>
              <span className="font-bold text-base" style={{ color: "#002f73" }}>
                Drag &amp; drop your .xlsx file here
              </span>
              <span className="text-sm text-gray-500 mt-1">or click to browse – max 5MB</span>
            </>
          )}
        </label>

        <p className="text-xs text-gray-400 mb-4">
          Required columns: <span className="font-mono text-[#064db6]">name, email, userId, strand, role, subjects</span>
          <br />Optional: <span className="font-mono text-[#4f4f4f]">schedule</span>
        </p>

        {/* Replace schedule toggle */}
        <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={replaceSchedule}
            onChange={(e) => setReplaceSchedule(e.target.checked)}
            className="w-4 h-4 accent-[#002f73]"
          />
          <span className="text-xs font-semibold text-[#1a1a1a]">
            Replace existing schedule if faculty already exists
          </span>
        </label>

        {error && (
          <p className="text-xs font-bold text-[#ed3a30] mb-4">{error}</p>
        )}

        <div className="border-b border-gray-100 mb-5" />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !selectedFile}
            className="px-4 py-1.5 text-[11px] font-bold text-white bg-[#002f73] hover:bg-[#064db6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  );
}