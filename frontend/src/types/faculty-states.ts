export type FacultyStatus = 
    | "available"
    | "in-class"
    | "on-break"
    | "off-campus"
    | "in-meeting"
    | "do-not-disturb";

export type Strands = 
    | "STEM"
    | "ABM"
    | "HUMSS";

export interface ConsultationHours {
    day: string;
    startTime: string;
    endTime: string;
}

export interface ScheduleEntry {
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    room: string;
}

export interface Faculty {
    id: string;
    name: string;
    role: string;
    strand: Strands;
    photoUrl: string;
    status: FacultyStatus;

    currentLocation: string; //always present

    subject?: string; //only present if status is "in-class"
    meetingWith?: string; //only present if status is "in-meeting"
    returnTime?: string; //only present if status is "on-break"
    note?: string;
    currentPeriod?: string; //only present if status is "in-class"
    consultationHours?: ConsultationHours[]; //only present if status is "available"
    schedule?: ScheduleEntry[]; //only present if status is "in-class"

}



