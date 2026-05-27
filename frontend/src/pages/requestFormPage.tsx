import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { type Room } from "@/types/requestForm";
import type { FormState, FormErrors, UrgencyLevel, RoomStatus } from "@/types/requestForm";
import { mockRooms, strands, teachers, teacherEmails, strandHeadsEmail } from "@/data/mockRequestForm";

// Sub-components
interface ConsultationRoomPickerProps {
  rooms: Room[];
  selected: string;
  onChange: (roomId: string) => void;
  disabled?: boolean;
}

function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase();
}

function ConsultationRoomPicker({ rooms, selected, onChange, disabled }: ConsultationRoomPickerProps) {
  const statusStyles: Record<RoomStatus, string> = {
    available: "bg-white border border-[#31ac52] text-[#1a1a1a] cursor-pointer hover:border-[#064db6] hover:bg-[#064db6]/5 transition-all",
    occupied: "bg-[#ed3a30]/10 text-[#ed3a30] border border-[#ed3a30]/30 cursor-not-allowed opacity-60",
    reserved: "bg-[#ffef5f]/20 text-[#4f4f4f] border border-[#ffef5f]/60 cursor-not-allowed opacity-60",
  };
  const selectedStyle = "bg-[#064db6] text-white border border-[#064db6] cursor-pointer";
  const walkInSelected = normalizeRoomCode(selected) === "WALK-IN";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {rooms.map((room) => {
        const isDisabled = room.status !== "available";
        const globalDisabled = disabled ?? false;
        const isSelected = normalizeRoomCode(selected) === normalizeRoomCode(room.id);
        const style = isSelected && room.status === "available" ? selectedStyle : statusStyles[room.status];
        return (
          <button
            key={room.id}
            type="button"
            disabled={isDisabled || globalDisabled}
            onClick={() => onChange(room.id)}
            className={`px-4 py-1.5 text-sm font-black tracking-wide transition-all ${style}`}
          >
            {room.id}
          </button>
        );
      })}
      <button
        type="button"
        className={`px-4 py-1.5 border text-sm font-black tracking-wide transition-all ${walkInSelected ? selectedStyle : "border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"}`}
        onClick={() => onChange("walk-in")}
        disabled={false}
      >
        WALK-IN
      </button>
    </div>
  );
}

function getPhilippineNow(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '00';

  return new Date(
    `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
  );
}

function parseTimeToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

  if (!match) return null;

  const [, hourText, minuteText, periodText] = match;
  let hour = Number(hourText);
  const minute = Number(minuteText);
  const period = periodText ? periodText.toUpperCase() : null;

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) {
    return null;
  }

  if (period) {
    if (hour < 1 || hour > 12) return null;

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
  }

  if (hour < 0 || hour > 23) {
    return null;
  }

  return hour * 60 + minute;
}

function formatInputTimeLabel(value: string): string {
  const minutes = parseTimeToMinutes(value);

  if (minutes === null) {
    return value;
  }

  const hour24 = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, '0');
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const displayHour = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatMinutesToInputValue(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (normalizedMinutes % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

function buildTimeRangeLabel(startTime: string, endTime: string): string {
  return `${formatInputTimeLabel(startTime)} – ${formatInputTimeLabel(endTime)}`;
}

function parseTimeRangeLabel(slot: string): { start: number; end: number } | null {
  const parts = slot.split(/\s*(?:–|-|—)\s*/).map((part) => part.trim()).filter(Boolean);

  if (parts.length !== 2) return null;

  const start = parseTimeToMinutes(parts[0]);
  const end = parseTimeToMinutes(parts[1]);

  if (start === null || end === null) return null;

  return { start, end };
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

function getTimeWindowError(startTime: string, endTime: string): string | null {
  const OFFICE_START = 7 * 60; // 07:00 in minutes
  const OFFICE_END = 17 * 60; // 17:00 in minutes
  if (!startTime.trim()) return 'Start time is required.';
  if (!endTime.trim()) return 'End time is required.';

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes !== null && (startMinutes < OFFICE_START || startMinutes > OFFICE_END)) {
    return 'Start time must be within office hours (07:00 – 17:00).';
  }

  if (startMinutes === null) return 'Start time must be valid.';
  if (endMinutes === null) return 'End time must be valid.';
  if (endMinutes <= startMinutes) return 'End time must be later than start time.';

  const duration = endMinutes - startMinutes;

  if (duration < 5) return 'Consultation time must be at least 5 minutes.';
  if (duration > 60) return 'Consultation time cannot exceed 1 hour.';

  return null;
}

interface UrgencySelectorProps {
  selected: UrgencyLevel | "";
  onChange: (value: UrgencyLevel) => void;
}

function UrgencySelector({ selected, onChange }: UrgencySelectorProps) {
  const levels: { value: UrgencyLevel; label: string; color: string }[] = [
    { value: "high", label: "HIGH", color: "#ed3a30" },
    { value: "medium", label: "MEDIUM", color: "#ff914d" },
    { value: "low", label: "LOW", color: "#31ac52" },
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
  const navigate = useNavigate();
  const prefillStudentId = searchParams.get("studentId") ?? "";
  const prefillName = searchParams.get("name") ?? "";

  const BASE_URL = (import.meta.env.VITE_API_URL || 'https://facultyboard-cqdzg5a8dwccegby.japaneast-01.azurewebsites.net');

  const [rooms, setRooms] = useState<Room[]>(mockRooms);

  const [form, setForm] = useState<FormState>({
    name: prefillName,
    studentId: prefillStudentId,
    studentEmail: "",
    strand: "",
    teacher: "",
    reason: "",
    room: "",
    time: "",
    urgency: "",
  });

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [teacherQuery, setTeacherQuery] = useState<string>("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState<boolean>(false);
  const teacherDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (!teacherDropdownRef.current) return;
      const target = e.target as Node | null;
      if (target && !teacherDropdownRef.current.contains(target)) {
        setShowTeacherDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [phTime, setPhTime] = useState<Date>(() => getPhilippineNow());
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const filteredTeachers = teachers.filter((t) =>
    t.toLowerCase().includes(teacherQuery.toLowerCase())
  );

  useEffect(() => {
    const selectedTeacher = form.teacher;
    if (!selectedTeacher) return;

    const controller = new AbortController();
    const cancelled = { current: false };

    const loadBookedTimes = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/requests/booked-times?teacher=${encodeURIComponent(selectedTeacher)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          if (!cancelled.current) setBookedTimes([]);
          return;
        }

        const data: { bookedTimes?: string[] } = await response.json();
        if (!cancelled.current) {
          setBookedTimes(Array.isArray(data.bookedTimes) ? data.bookedTimes : []);
        }
      } catch {
        if (!controller.signal.aborted) setBookedTimes([]);
      }
    };

    loadBookedTimes();

    return () => {
      cancelled.current = true;
      controller.abort();
    };
  }, [form.teacher]);

  useEffect(() => {
    const timeWindowError = getTimeWindowError(startTime, endTime);
    if (!startTime || !endTime || timeWindowError) return;

    const controller = new AbortController();
    const cancelled = { current: false };

    const loadRoomAvailability = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/requests/room-availability?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          if (!cancelled.current) setRooms(mockRooms);
          return;
        }

        const data: { data?: Array<{ roomCode?: string; status?: string }> } = await response.json();
        const nextRooms: Room[] = Array.isArray(data.data)
          ? data.data
            .filter((room) => typeof room.roomCode === 'string' && room.roomCode.trim())
            .map((room): Room => ({
              id: normalizeRoomCode(room.roomCode as string),
              status:
                String(room.status || '').toLowerCase() === 'reserved'
                  ? 'reserved'
                  : String(room.status || '').toLowerCase() === 'occupied'
                    ? 'occupied'
                    : 'available',
            }))
          : [];

        if (cancelled.current) return;

        setRooms(nextRooms.length > 0 ? nextRooms : mockRooms);

        if (form.room && form.room !== 'walk-in') {
          const selectedRoom = nextRooms.find(
            (room) => normalizeRoomCode(room.id) === normalizeRoomCode(form.room)
          );
          if (selectedRoom && selectedRoom.status !== 'available') {
            setForm((prev) => ({ ...prev, room: '' }));
            setErrors((prev) => ({
              ...prev,
              room: 'Selected room is already reserved for that time window.',
            }));
          }
        }
      } catch {
        if (!controller.signal.aborted) setRooms(mockRooms);
      }
    };

    loadRoomAvailability();

    return () => {
      cancelled.current = true;
      controller.abort();
    };
  }, [endTime, form.room, startTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhTime(getPhilippineNow());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const activeBookedTimes = bookedTimes.filter((slot) => {
    const slotRange = parseTimeRangeLabel(slot);

    if (!slotRange) return true;

    const nowMinutes = phTime.getHours() * 60 + phTime.getMinutes();
    return nowMinutes < slotRange.end;
  });

  const selectedTimeRange = startTime && endTime ? buildTimeRangeLabel(startTime, endTime) : "";

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    setErrors((prev) => ({ ...prev, time: undefined }));

    const OFFICE_START = 7 * 60;
    const OFFICE_END = 17 * 60;

    // If start outside office hours, set immediate error and clear end
    const startMinutes = parseTimeToMinutes(value);
    if (startMinutes !== null && (startMinutes < OFFICE_START || startMinutes > OFFICE_END)) {
      setErrors((prev) => ({ ...prev, time: 'Start time must be within office hours (07:00 – 17:00).' }));
      if (endTime) setEndTime("");
      return;
    }

    if (startMinutes !== null && endTime) {
      const endMinutes = parseTimeToMinutes(endTime);
      if (endMinutes === null) {
        setEndTime("");
        return;
      }
      const minAllowed = startMinutes + 5;
      const maxAllowed = Math.min(startMinutes + 60, 23 * 60 + 59);
      if (endMinutes < minAllowed || endMinutes > maxAllowed) {
        setEndTime("");
      }
    }
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    setErrors((prev) => ({ ...prev, time: undefined }));
  };

  const selectedTimeRangeMinutes =
    startTime && endTime
      ? (() => {
        const startMinutes = parseTimeToMinutes(startTime);
        const endMinutes = parseTimeToMinutes(endTime);

        if (startMinutes === null || endMinutes === null) return null;
        return { start: startMinutes, end: endMinutes };
      })()
      : null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required.";
    if (!form.studentId.trim()) {
      newErrors.studentId = "Student ID is required.";
    } else if (!/^\d{4}-\d{6}$/.test(form.studentId.trim())) {
      newErrors.studentId = "Invalid format. Use: 2025-123456";
    }
    if (!form.studentEmail.trim()) {
      newErrors.studentEmail = "Student email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.studentEmail.trim())) {
      newErrors.studentEmail = "Invalid email format.";
    }
    if (!form.strand) newErrors.strand = "Please select a strand.";
    if (!form.teacher) newErrors.teacher = "Please select a teacher.";
    const timeWindowError = getTimeWindowError(startTime, endTime);
    if (timeWindowError) {
      newErrors.time = timeWindowError;
    } else if (selectedTimeRangeMinutes && form.teacher) {
      const hasConflict = activeBookedTimes.some((slot) => {
        const bookedRange = parseTimeRangeLabel(slot);

        return bookedRange
          ? rangesOverlap(
            selectedTimeRangeMinutes.start,
            selectedTimeRangeMinutes.end,
            bookedRange.start,
            bookedRange.end
          )
          : false;
      });

      if (hasConflict) {
        newErrors.time = `${form.teacher} is already booked during that time window.`;
      }
    }
    if (!form.reason.trim()) newErrors.reason = "Reason is required.";
    const selectedRoom = rooms.find(
      (room) => normalizeRoomCode(room.id) === normalizeRoomCode(form.room)
    );
    const selectedDuration = selectedTimeRangeMinutes
      ? selectedTimeRangeMinutes.end - selectedTimeRangeMinutes.start
      : null;
    if (!form.room) {
      newErrors.room = "Please select a consultation room.";
    } else if (form.room !== 'walk-in' && selectedDuration !== null && selectedDuration < 30) {
      newErrors.room = "Consultation rooms are allowed if set time is 30 minutes or more.";
    } else if (form.room !== 'walk-in' && selectedRoom && selectedRoom.status !== 'available') {
      newErrors.room = "Selected room is already reserved for that time window.";
    }
    if (!form.urgency) newErrors.urgency = "Please select an urgency level.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const createResponse = await fetch(`${BASE_URL}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: form.name,
          studentId: form.studentId,
          studentEmail: form.studentEmail,
          strand: form.strand,
          teacher: form.teacher,
          teacherEmail: teacherEmails[form.teacher],
          reason: form.reason,
          room: form.room,
          time: selectedTimeRange,
          urgency: form.urgency,
          strandHeadEmail: strandHeadsEmail[form.strand]
        }),
      });

      if (!createResponse.ok) {
        console.error("Request creation failed:", await createResponse.text());
        return;
      }

      const createData = await createResponse.json();
      const mongoId = createData._id;

      if (!mongoId) {
        console.error("No _id returned from backend:", createData);
        return;
      }

      fetch(`/api/requests/trigger-flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: mongoId,
          studentName: form.name,
          studentId: form.studentId,
          studentEmail: form.studentEmail,
          strand: form.strand,
          teacher: form.teacher,
          teacherEmail: teacherEmails[form.teacher],
          reason: form.reason,
          room: form.room,
          time: selectedTimeRange,
          urgency: form.urgency,
          strandHeadEmail: strandHeadsEmail[form.strand]
        }),
      }).catch(console.error);

      navigate(`/status?requestId=${mongoId}`);

    } catch (err) {
      console.error("Submission error:", err);
    }
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
              setForm({ name: "", studentId: "", strand: "", teacher: "", reason: "", room: "", time: "", urgency: "", studentEmail: "" });
              setStartTime("");
              setEndTime("");
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

  const inputBase = "w-full border px-3 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#d6d6d6] focus:outline-none focus:ring-1 focus:ring-[#064db6]/30 transition-all";
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

          {/* Student Email */}
          <div>
            {fieldLabel("Student Email:", "studentEmail")}
            <input
              id="studentEmail"
              type="email"
              placeholder="Ex. delacruzj@students.nu-laguna.edu.ph"
              value={form.studentEmail}
              onChange={(e) => set("studentEmail", e.target.value)}
              className={`${inputBase} ${inputBorder("studentEmail")}`}
            />
            {errorMsg("studentEmail")}
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
          <div className="relative" ref={teacherDropdownRef}>
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

          <div>
            <label className="block text-xs font-black text-[#1a1a1a] uppercase tracking-widest mb-1.5">Time Window:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="startTime" className="block text-[11px] font-bold uppercase tracking-widest text-[#4f4f4f] mb-1">Start Time</label>
                <input
                  id="startTime"
                  type="time"
                  step={60}
                  min="07:00"
                  max="17:00"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={`${inputBase} ${inputBorder("time")}`}
                />
                <div className="flex items-center gap-2 mt-2">
                  {startTime && (
                    <p className="text-[11px] text-[#4f4f4f]">{formatInputTimeLabel(startTime)} PST</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const now = getPhilippineNow();
                      const hours = String(now.getHours()).padStart(2, '0');
                      const minutes = String(now.getMinutes()).padStart(2, '0');
                      handleStartTimeChange(`${hours}:${minutes}`);
                    }}
                    className="ml-auto text-[11px] font-bold text-[#064db6] hover:text-[#002f73] hover:underline transition-colors"
                  >
                    NOW
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="endTime" className="block text-[11px] font-bold uppercase tracking-widest text-[#4f4f4f] mb-1">
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  step={60}
                  min={startTime ? formatMinutesToInputValue(parseTimeToMinutes(startTime)! + 5) : ""}
                  max="17:00"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  disabled={!startTime}
                  className={`${inputBase} ${inputBorder("time")} ${!startTime ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                />
                {endTime && (
                  <p className="text-[11px] text-[#4f4f4f] mt-1">{formatInputTimeLabel(endTime)} PST</p>
                )}
              </div>
            </div>
            {selectedTimeRange && (
              <p className="mt-0 text-xs font-semibold" style={{ color: 'var(--secondary)' }}>Selected time: {selectedTimeRange}</p>
            )}
            {form.teacher && activeBookedTimes.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-bold text-[#4f4f4f]">
                  {form.teacher} has {activeBookedTimes.length} active booked consultation window{activeBookedTimes.length === 1 ? "" : "s"}:
                </p>
                <ul className="mt-1 text-xs font-bold text-[#4f4f4f] list-disc pl-5 space-y-0.5">
                  {activeBookedTimes.map((slot) => (
                    <li key={slot} style={{ color: 'var(--destructive)' }}>{slot}</li>
                  ))}
                </ul>
              </div>
            )}
            {errorMsg("time")}
          </div>

          {/* Consultation Rooms (moved after Time Window) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-[#1a1a1a] uppercase tracking-widest">Consultation Rooms:</label>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-[#4f4f4f]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffef5f] inline-block" />Reserved</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#31ac52] inline-block" />Available</span>
              </div>
            </div>
            <ConsultationRoomPicker rooms={rooms} selected={form.room} onChange={(v) => set("room", v)} disabled={!startTime || !endTime} />
            {!startTime || !endTime ? (
              <p className="mt-2 text-xs text-[#4f4f4f]">Please select a time window first to choose a room.</p>
            ) : null}
            {errorMsg("room")}
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