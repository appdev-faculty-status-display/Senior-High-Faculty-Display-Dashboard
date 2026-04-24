export type Strand = "STEM" | "HUMSS" | "ABM";
export type Day = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
export type Status = "IN CLASS" | "AVAILABLE" | "OFF CAMPUS" | "ON BREAK" | "IN MEETING" | "DO NOT DISTURB";

export interface FacultySchedule {
    id: number;
    name: string;
    avatarInitials: string;
    avatarColor: string;
    subject: string;
    strand: Strand;
    room: string;
    status: Status;
    time: string;
    day: Day;
}