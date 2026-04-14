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

export interface consultationHours {
    start: string;
    end: string;
}

export interface Faculty {
    id: string;
    name: string;
    strand: Strands;
    photoUrl: string;
    status: FacultyStatus;

    currentLocation: string; //always present

    subject?: string; //only present if status is "in-class"
    consultationHours?: consultationHours; //only present if status is "available"
    meetingWith?: string; //only present if status is "in-meeting"
    returnTime?: string; //only present if status is "on-break"
    note?: string;
    currentPeriod?: string; //only present if status is "in-class"

}



