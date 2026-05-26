// frontend/src/components/modal/EditFacultyModal.tsx
import { useState, useRef } from "react";
import type { KeyboardEvent } from "react";

export interface FacultyTableRow {
  id: string;
  name: string;
  strand: string;
  role: string;
  status: string;
  location: string;
  subjects: string;
  consultationHours: string;
}

interface Props {
  faculty: FacultyTableRow;
  onClose: () => void;
  onSave: (updated: FacultyTableRow) => void;
  onDelete: (id: string) => void;
}

const STRANDS = ["STEM", "ABM", "HUMSS"];
const ROLES   = ["faculty", "strand_head"];

const inputClass =
  "w-full border border-gray-300 px-2 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400 appearance-none";
const labelClass =
  "block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1";

export default function EditFacultyModal({ faculty, onClose, onSave, onDelete }: Props) {
  const [name,     setName]     = useState(faculty.name);
  const [strand,   setStrand]   = useState(faculty.strand);
  const [role,     setRole]     = useState(faculty.role);
  const [location, setLocation] = useState(faculty.location);

  // Parse subjects string back into array (stored as "Biology, Chemistry")
  const [subjects, setSubjects] = useState<string[]>(
    faculty.subjects === "—" ? [] : faculty.subjects.split(", ").filter(Boolean)
  );
  const [subjectInput, setSubjectInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addSubject(value: string) {
    const trimmed = value.trim().replace(/,$/, "");
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects((prev) => [...prev, trimmed]);
    }
    setSubjectInput("");
  }

  function handleSubjectKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSubject(subjectInput);
    } else if (e.key === "Backspace" && subjectInput === "" && subjects.length > 0) {
      setSubjects((prev) => prev.slice(0, -1));
    }
  }

  function removeSubject(index: number) {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    onSave({
      ...faculty,
      name,
      strand,
      role,
      location,
      subjects: subjects.length > 0 ? subjects.join(", ") : "—",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white shadow-lg w-full max-w-lg p-8 border border-gray-100">
        <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
          Edit Faculty
        </h2>
        <div className="border-b-2 border-yellow-400 mb-6" />

        <div className="grid grid-cols-2 gap-4">

          {/* Name */}
          <div className="col-span-2">
            <label className={labelClass}>Faculty Member</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Strand */}
          <div>
            <label className={labelClass}>Strand</label>
            <div className="relative">
              <select
                value={strand}
                onChange={(e) => setStrand(e.target.value)}
                className={inputClass + " pr-8"}
              >
                {STRANDS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">⌵</span>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className={labelClass}>Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass + " pr-8 capitalize"}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">⌵</span>
            </div>
          </div>

          {/* Location */}
          <div className="col-span-2">
            <label className={labelClass}>Current Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Subjects — tag input */}
          <div className="col-span-2">
            <label className={labelClass}>Subjects</label>
            <div
              className="min-h-[42px] w-full border border-gray-300 px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text focus-within:border-yellow-400"
              onClick={() => inputRef.current?.focus()}
            >
              {subjects.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-[#e8edf5] text-[#002f73] text-xs font-semibold px-2 py-0.5"
                >
                  {s}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeSubject(i); }}
                    className="text-[#002f73] hover:text-[#ed3a30] font-bold leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                onKeyDown={handleSubjectKeyDown}
                onBlur={() => { if (subjectInput.trim()) addSubject(subjectInput); }}
                placeholder={subjects.length === 0 ? "Type and press Enter to add…" : ""}
                className="flex-1 min-w-[120px] text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Press Enter or comma to add a subject. Backspace to remove last.</p>
          </div>

        </div>

        <div className="border-b border-gray-100 mt-6 mb-6" />

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => { onDelete(faculty.id); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#fde8e7] hover:border-[#ed3a30] hover:text-[#ed3a30] transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#002f73] border border-[#cbd5e1] bg-white hover:bg-[#f0f4ff] hover:border-[#064db6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-[#002f73] border border-[#002f73] hover:bg-[#064db6] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}