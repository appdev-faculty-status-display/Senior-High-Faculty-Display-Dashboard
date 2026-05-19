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

export const badgeClass: Record<Status, string> = {
    "AVAILABLE": "bg-green-100 text-green-800",
    "IN CLASS": "bg-yellow-100 text-yellow-700",
    "IN MEETING": "bg-purple-100 text-purple-700",
    "ON BREAK": "bg-blue-100 text-blue-700",
    "OFF CAMPUS": "bg-orange-100 text-orange-700",
    "DO NOT DISTURB": "bg-red-200 text-red-900",
};
