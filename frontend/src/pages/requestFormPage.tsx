import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { type Room } from "@/types/requestForm";
import type { FormState, FormErrors, UrgencyLevel, RoomStatus } from "@/types/requestForm";
import { mockRooms, strands, teachers } from "@/data/mockRequestForm";
import { generateTimeSlots } from "@/utils/timeSlots";

// Sub-components
interface ConsultationRoomPickerProps {
  rooms: Room[];
  selected: string;
  onChange: (roomId: string) => void;
}

function ConsultationRoomPicker({ rooms, selected, onChange }: ConsultationRoomPickerProps) {
  const statusStyles: Record<RoomStatus, string> = {
    available: "bg-white border border-[#31ac52] text-[#1a1a1a] cursor-pointer hover:border-[#064db6] hover:bg-[#064db6]/5 transition-all",
    occupied:  "bg-[#ed3a30]/10 text-[#ed3a30] border border-[#ed3a30]/30 cursor-not-allowed opacity-60",
    reserved:  "bg-[#ffef5f]/20 text-[#4f4f4f] border border-[#ffef5f]/60 cursor-not-allowed opacity-60",
  };
  const selectedStyle = "bg-[#064db6] text-white border border-[#064db6] cursor-pointer";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {rooms.map((room) => {
        const isDisabled = room.status !== "available";
        const isSelected = selected === room.id;
        const style = isSelected ? selectedStyle : statusStyles[room.status];
        return (
          <button
            key={room.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(room.id)}
            className={`px-4 py-1.5 text-sm font-black tracking-wide transition-all ${style}`}
          >
            {room.id}
          </button>
        );
      })}
      <button
        type="button"
        className="ml-auto px-5 py-1.5 border border-[#1a1a1a] text-sm font-black text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all"
        onClick={() => onChange("walk-in")}
      >
        WALK-IN
      </button>
    </div>
  );
}

interface TimeSlotDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

function TimeSlotDropdown({ value, onChange }: TimeSlotDropdownProps) {
  const slots = generateTimeSlots(7, 17);
  return (
    <div className="relative mt-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-[#cbd5e1] px-3 py-2.5 text-sm appearance-none bg-white focus:outline-none focus:border-[#064db6] focus:ring-1 focus:ring-[#064db6]/30 transition-all ${
          value ? "text-[#1a1a1a]" : "text-[#d6d6d6]"
        }`}
      >
        <option value="" disabled>Select a time slot</option>
        {slots.map((s) => (
          <option key={s} value={s} className="text-[#1a1a1a]">{s}</option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="#4f4f4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

interface UrgencySelectorProps {
  selected: UrgencyLevel | "";
  onChange: (value: UrgencyLevel) => void;
}

function UrgencySelector({ selected, onChange }: UrgencySelectorProps) {
  const levels: { value: UrgencyLevel; label: string; color: string }[] = [
    { value: "high",   label: "HIGH",   color: "#ed3a30" },
    { value: "medium", label: "MEDIUM", color: "#ff914d" },
    { value: "low",    label: "LOW",    color: "#31ac52" },
  ];
  return (
    <div className="flex items-center gap-6" role="radiogroup">
      {levels.map((level) => (
        <label
          key={level.value}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <input
            type="radio"
            name="urgency"
            value={level.value}
            checked={selected === level.value}
            onChange={() => onChange(level.value)}
            className="sr-only"
          />
          <div
            className="relative w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all"
            style={{
              borderColor: level.color,
              backgroundColor: selected === level.value ? level.color : "transparent",
            }}
          >
            {selected === level.value && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <span
            className="text-sm font-black tracking-wide"
            style={{ color: selected === level.value ? level.color : "#4f4f4f" }}
          >
            {level.label}
          </span>
        </label>
      ))}
    </div>
  );
}

// Main Page
export default function RequestForm() {
  const [searchParams] = useSearchParams();
  const prefillStudentId = searchParams.get("studentId") ?? "";
  const prefillName      = searchParams.get("name") ?? "";

  const rooms: Room[] = mockRooms;

  const [form, setForm] = useState<FormState>({
    name:      prefillName,
    studentId: prefillStudentId,
    strand:    "",
    teacher:   "",
    reason:    "",
    room:      "",
    time:      "",
    urgency:   "",
  });

  const [submitted, setSubmitted]                         = useState<boolean>(false);
  const [errors, setErrors]                               = useState<FormErrors>({});
  const [teacherQuery, setTeacherQuery]                   = useState<string>("");
  const [showTeacherDropdown, setShowTeacherDropdown]     = useState<boolean>(false);

  const filteredTeachers = teachers.filter((t) =>
    t.toLowerCase().includes(teacherQuery.toLowerCase())
  );

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim())      newErrors.name      = "Name is required.";
    if (!form.studentId.trim()) {
        newErrors.studentId = "Student ID is required.";    
    } else if (!/^\d{4}-\d{6}$/.test(form.studentId.trim())) {
        newErrors.studentId = "Invalid format. Use: 2025-123456";
    }
    if (!form.strand)           newErrors.strand    = "Please select a strand.";
    if (!form.teacher)          newErrors.teacher   = "Please select a teacher.";
    if (!form.reason.trim())    newErrors.reason    = "Reason is required.";
    if (!form.room)             newErrors.room      = "Please select a consultation room.";
    if (!form.time)             newErrors.time      = "Please select a time slot.";
    if (!form.urgency)          newErrors.urgency   = "Please select an urgency level.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-[#cbd5e1] px-6 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[#31ac52]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#31ac52" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-widest mb-2">Request Submitted!</h2>
          <p className="text-sm text-[#4f4f4f]">
            Your consultation request has been received. You will be notified once it's confirmed.
          </p>
          <button
            type="button"
            onClick={() => {
                setSubmitted(false);
                setForm({ name: "", studentId: "", strand: "", teacher: "", reason: "", room: "", time: "", urgency: "" });
                setTeacherQuery("");
                setShowTeacherDropdown(false);
                setErrors({});
            }}
            className="mt-6 px-6 py-2.5 bg-[#064db6] text-white text-sm font-black tracking-widest hover:bg-[#002f73] transition-all"
          >
            SUBMIT ANOTHER
          </button>
        </div>
      </div>
    );
  }

  const inputBase  = "w-full border px-3 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#d6d6d6] focus:outline-none focus:ring-1 focus:ring-[#064db6]/30 transition-all";
  const inputBorder = (field: keyof FormErrors) =>
    errors[field] ? "border-[#ed3a30] focus:border-[#ed3a30]" : "border-[#cbd5e1] focus:border-[#064db6]";
  const errorMsg = (field: keyof FormErrors) =>
    errors[field] ? <p className="text-xs text-[#ed3a30] mt-1">{errors[field]}</p> : null;
  const fieldLabel = (text: string, fieldId: string) => (
    <label
        htmlFor={fieldId}
        className="block text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-1.5"
    >
        {text}
    </label>
    );

  return (
    <div className="min-h-screen bg-[#f5f6fa] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Header Banner */}
        <div className="mb-5">
          <div className="px-5 py-4 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #002f73 0%, #064db6 100%)" }}>
            <img src={logo} alt="NU Logo" className="w-12 h-12 object-contain flex-shrink-0" />
            <div>
              <h1 className="text-white font-black text-base leading-tight tracking-widest uppercase">
                Consultation Request Form
              </h1>
              <p className="text-[#ffc107] text-xs mt-0.5 font-medium">
                Fill out this form to set a consultation schedule with your preferred teacher.
              </p>
            </div>
          </div>
          <div className="h-2 bg-[#ffc107]" />
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#cbd5e1] px-5 py-6 space-y-5">

          {/* Name */}
          <div>
            {fieldLabel("Name:", "name")}
            <input id="name" type="text" placeholder="Ex. Dela Cruz, Juan A." value={form.name} onChange={(e) => set("name", e.target.value)} className={`${inputBase} ${inputBorder("name")}`} />
            {errorMsg("name")}
          </div>

          {/* Student ID */}
          <div>
            {fieldLabel("Student ID:", "studentId")}
            <input id="studentId" type="text" placeholder="Ex. 2025-123456" value={form.studentId} onChange={(e) => set("studentId", e.target.value)} className={`${inputBase} ${inputBorder("studentId")}`} />
            {errorMsg("studentId")}
          </div>

          {/* Strand */}
          <div>
            {fieldLabel("Strand:", "strand")}
            <div className="relative">
              <select id="strand" value={form.strand} onChange={(e) => set("strand", e.target.value)} className={`w-full border px-3 py-2.5 text-sm appearance-none bg-white focus:outline-none focus:border-[#064db6] focus:ring-1 focus:ring-[#064db6]/30 transition-all ${form.strand ? "text-[#1a1a1a]" : "text-[#d6d6d6]"} ${inputBorder("strand")}`}>
                <option value="" disabled>Select Strand</option>
                {strands.map((s) => <option key={s} value={s} className="text-[#1a1a1a]">{s}</option>)}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="#4f4f4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {errorMsg("strand")}
          </div>

          {/* Teacher */}
          <div className="relative">
            {fieldLabel("Teacher:", "teacher")}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#4f4f4f" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="#4f4f4f" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                id="teacher"
                type="text"
                placeholder="Search for Teacher"
                value={form.teacher || teacherQuery}
                onChange={(e) => { setTeacherQuery(e.target.value); set("teacher", ""); setShowTeacherDropdown(true); }}
                onFocus={() => setShowTeacherDropdown(true)}
                className={`w-full border pl-9 pr-3 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#d6d6d6] focus:outline-none focus:border-[#064db6] focus:ring-1 focus:ring-[#064db6]/30 transition-all ${inputBorder("teacher")}`}
              />
            </div>
            {showTeacherDropdown && filteredTeachers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[#cbd5e1] shadow-md overflow-hidden">
                {filteredTeachers.map((t) => (
                  <button key={t} type="button" className="w-full text-left px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#064db6]/5 transition-colors"
                    onClick={() => { set("teacher", t); setTeacherQuery(t); setShowTeacherDropdown(false); }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {errorMsg("teacher")}
          </div>

          {/* Reason */}
          <div>
            {fieldLabel("Reason:", "reason")}
            <textarea id="reason" placeholder="Enter reason for consultation..." value={form.reason} onChange={(e) => set("reason", e.target.value)} rows={4} className={`w-full border px-3 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#d6d6d6] resize-none focus:outline-none focus:border-[#064db6] focus:ring-1 focus:ring-[#064db6]/30 transition-all ${inputBorder("reason")}`} />
            {errorMsg("reason")}
          </div>

          {/* Consultation Rooms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest">Consultation Rooms:</label>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-[#4f4f4f]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ed3a30] inline-block" />Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffef5f] inline-block" />Reserved</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#31ac52] inline-block" />Available</span>
              </div>
            </div>
            <ConsultationRoomPicker rooms={rooms} selected={form.room} onChange={(v) => set("room", v)} />
            <TimeSlotDropdown value={form.time} onChange={(v) => set("time", v)} />
            {errorMsg("room")}
            {errorMsg("time")}
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-2">Urgency:</label>
            <UrgencySelector selected={form.urgency} onChange={(v) => set("urgency", v)} />
            {errorMsg("urgency")}
          </div>

          {/* Important Notes */}
          <div className="bg-[#f5f6fa] px-4 py-3 border border-[#cbd5e1]">
            <p className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-2">⚠ Important Notes:</p>
            <ul className="text-xs text-[#4f4f4f] space-y-1 list-disc pl-4">
              <li>Ensure all fields are filled out completely before submitting.</li>
              <li>Indicate urgency honestly to help teachers prioritize requests.</li>
              <li>Submissions are subject to teacher's approval.</li>
              <li>You will receive confirmation once your consultation is scheduled.</li>
            </ul>
          </div>

          {/* Submit */}
          <button type="button" onClick={handleSubmit} className="w-full bg-[#ffc107] hover:bg-[#ffd41c] active:scale-[0.98] text-[#002f73] font-black text-sm tracking-widest py-4 transition-all duration-150 uppercase">
            Submit Form
          </button>

        </div>
      </div>
    </div>
  );
}