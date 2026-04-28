import { useState } from "react";
import type { FacultySchedule, Strand, Status, Day } from "../../types/schedule";
import { STRANDS, DAYS, ROOMS } from "../../data/mockAddSchedule";
import { Button } from "@/components/ui/button"; 

interface Props {
    schedule: FacultySchedule;
    onClose: () => void;
    onSave: (updated: FacultySchedule) => void;
    onDelete: (id: number) => void;
    }

    export default function EditScheduleModal({ schedule, onClose, onSave, onDelete }: Props) {
    const [name, setName] = useState(schedule.name);
    const [subject, setSubject] = useState(schedule.subject);
    const [strand, setStrand] = useState<Strand>(schedule.strand);
    const [room, setRoom] = useState(schedule.room);
    const [status, setStatus] = useState<Status>(schedule.status);
    const [time, setTime] = useState(schedule.time);
    const [day, setDay] = useState<Day>(schedule.day);

    const inputClass = "w-full border border-gray-300 px-2 py-2 text-sm text-gray-700 outline-none focus:border-yellow-400 appearance-none pr-8";
    const labelClass = "block text-xs font-bold tracking-widest text-gray-500 uppercase mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white shadow-lg w-full max-w-lg p-8 border border-gray-100">
            <h2 className="text-xl font-extrabold tracking-tight mb-1" style={{ color: "#002f73" }}>
            Edit Schedule
            </h2>
            <div className="border-b-2 border-yellow-400 mb-6" />

            <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className={labelClass}>Faculty Member</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>

            <div>
                <label className={labelClass}>Subject</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
            </div>

            <div>
            <label className={labelClass}>Strand</label>
            <div className="relative">
                <select
                value={strand}
                onChange={(e) => setStrand(e.target.value as Strand)}
                className={inputClass}
                >
                {STRANDS.filter((s) => s !== "All Strands").map((s) => (
                    <option key={s}>{s}</option>
                ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                ⌵
                </span>
            </div>
            </div>

            <div>
                <label className={labelClass}>Room</label>
                <div className="relative">
                <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className={inputClass}
                >
                {ROOMS.filter((r) => r !== "All Rooms").map((r) => (
                    <option key={r}>{r}</option>
                ))}
                </select><span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                ⌵
                </span>
                </div>
            </div>

            <div>
                <label className={labelClass}>Day</label>
                <div className="relative">
                <select
                value={day}
                onChange={(e) => setDay(e.target.value as Day)}
                className={inputClass}
                >
                {DAYS.filter((d) => d !== "All Days").map((d) => (
                    <option key={d}>{d}</option>
                ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                ⌵
                </span>
                </div>
            </div>

            <div>
                <label className={labelClass}>Time</label>
                <input type="text" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} placeholder="e.g. 7:00 – 9:00" />
            </div>

            <div>
                <label className={labelClass}>Status</label>
                <div className="relative">
                <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className={inputClass}
                >
                {(["IN CLASS", "AVAILABLE", "OFF CAMPUS", "DO NOT DISTURB", "IN MEETING", "ON BREAK"] as Status[]).map((s) => (
                    <option key={s}>{s}</option>
                ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                ⌵
                </span>
                </div>
            </div>
            </div>

            <div className="border-b border-gray-100 mt-6 mb-6" />

            <div className="flex items-center justify-end gap-3">
            <Button variant="active"
                onClick={() => { onDelete(schedule.id); onClose(); }}
            >
                Delete
            </Button>
            <Button variant="active" onClick={onClose}>
                Cancel
            </Button>
            <Button variant="active"
                onClick={() => {
                onSave({ ...schedule, name, subject, strand, room, status, time, day });
                onClose();
                }}
            >
                Save Changes
            </Button>
            </div>
        </div>
        </div>
    );
    }