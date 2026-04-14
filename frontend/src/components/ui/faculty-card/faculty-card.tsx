import React from "react";
import type { Faculty, FacultyStatus } from "../../../types/faculty-states";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Status Config
interface StatusConfig {
    label: string;
    badgeBg: string;
    badgeText: string;
}

const STATUS_CONFIG: Record<FacultyStatus, StatusConfig> = {
    available: {
        label: "AVAILABLE",
        badgeBg: "bg-[var(--available)]",
        badgeText: "text-white",
    },
    "in-class": {
        label: "IN CLASS",
        badgeBg: "bg-[var(--in-class)]",
        badgeText: "text-[var(--black)]",
    },
    "on-break": {
        label: "ON BREAK",
        badgeBg: "bg-[var(--on-break)]",
        badgeText: "text-white",
    },
    "off-campus": {
        label: "OFF CAMPUS",
        badgeBg: "bg-[var(--off-campus)]",
        badgeText: "text-white",
    },
    "in-meeting": {
        label: "IN MEETING",
        badgeBg: "bg-[var(--in-meeting)]",
        badgeText: "text-white",
    },
    "do-not-disturb": {
        label: "DO NOT DISTURB",
        badgeBg: "bg-[var(--do-not-disturb)]",
        badgeText: "text-white",
    },
};

// Sub components
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[8px] uppercase text-[#5a7698]">
                {label}
            </span>
            <span className="text-[10px] text-foreground">
                {value}
            </span>
        </div>
    );
}

// Main Component
export function FacultyCard({ faculty }: { faculty: Faculty }) {
    const config = STATUS_CONFIG[faculty.status];

    // Helper to get initials for avatar fallback
    const getInitials = faculty.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);


    const getDynamicRow = () => {

        if (faculty.status === "off-campus"){
            return {label: "Expected Return", value: faculty.returnTime || "TBD"};
        }
        switch (faculty.status) {
            case "in-class":
                return { 
                    label: "Current Period", 
                    value: faculty.currentPeriod || faculty.subject || "In Session" 
                };
            case "in-meeting":
                return { 
                    label: "Meeting With", 
                    value: faculty.meetingWith || "Private Meeting" 
                };
            case "on-break":
            case "do-not-disturb":
                return { 
                    label: "Expected Return", 
                    value: faculty.returnTime || "TBD" 
                };
            case "available":
            default:
                return { 
                    label: "Current Period", 
                    value: faculty.currentPeriod || "Free Period" 
                };
        }
    };    

    const dynamicRow = getDynamicRow();

    return (
        <Card className="relative w-60 overflow-hidden transition-all hover:shadow-lg">

            {/* Status Header Bar */}
            <div className={cn("w-full px-4 py-2 m-0", config.badgeBg)}>
                <span className={cn("block text-xs font-bold uppercase tracking-wide", config.badgeText)}>
                    {config.label}
                </span>
            </div>

            {/* Name + Avatar */}
            <div className="flex flex-row items-center justify-between w-full px-4 py-2">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-xs font-normal text-foreground leading-tight">{faculty.name}</h3>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                        {faculty.strand}
                    </span>
                </div>
                <Avatar className="h-10 w-10 shrink-0 shadow-sm border border-muted/50">
                    <AvatarImage src={faculty.photoUrl} alt={faculty.name} />
                    <AvatarFallback className="bg-muted text-xs font-bold text-muted-foreground">
                        {getInitials}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Info Rows - padded extra on the left to indent past the name */}
            <CardContent className="space-y-1 px-4 py-2">
                {/* Row 1: Location */}
                <InfoRow 
                    label="Current Location" 
                    value={faculty.currentLocation || "Room Not Set"} 
                />

                {/* Row 2: Dynamic Status Info */}
                <InfoRow 
                    label={dynamicRow.label} 
                    value={dynamicRow.value} 
                />
            </CardContent>
            {/* Row 3: Consultation Hours (Moved inside Content) */}
            {faculty.status === "off-campus" || faculty.status === "do-not-disturb" ? (
                <div className="rounded-md bg-muted/50 p-2.5 mx-4 mb-4 h-12 flex items-center justify-center">
                    <p className="text-[11px] italic leading-snug text-muted-foreground">
                        "{faculty.note || "No additional note provided."}"
                    </p>
                </div>
            ):(
                <div className="mx-4 mb-4 flex flex-col justify-center border-l-4 border-[#002d5d] bg-[#ffc107] px-3 py-2">
                    <span className="text-[10px] font-bold uppercase text-slate-800/70">
                        Consultation Hours
                    </span>
                    <span className="text-xs font-medium text-slate-900">
                        {faculty.consultationHours 
                            ? `${faculty.consultationHours.start} - ${faculty.consultationHours.end}`
                            : "No Hours Set"
                        }
                    </span>
                </div>
            )}

        </Card>
    );
}