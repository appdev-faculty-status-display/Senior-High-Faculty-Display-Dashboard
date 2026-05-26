export type RoomStatus = "occupied" | "reserved" | "available";
export type UrgencyLevel = "high" | "medium" | "low";

export interface Room {
  id: string;
  status: RoomStatus;
}

export interface FormState {
  name: string;
  studentId: string;
  studentEmail: string;
  strand: string;
  teacher: string;
  purpose: string;
  reason: string;
  room: string;
  time: string;
  urgency: UrgencyLevel | "";
}

export interface FormErrors {
  name?: string;
  studentId?: string;
  studentEmail?: string;
  strand?: string;
  teacher?: string;
  purpose?: string;
  reason?: string;
  room?: string;
  time?: string;
  urgency?: string;
}