import type { ScheduleEntry, FacultyStatus } from "@/types/faculty-states";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export interface DerivedStatus {
  status: FacultyStatus;
  currentPeriod: string | null;
  currentLocation: string | null;
}

export function deriveStatusFromSchedule(
  schedule: ScheduleEntry[] | undefined,
  serverStatus: FacultyStatus,
  serverLocation: string
): DerivedStatus {
  // If the server has set a manual override status, respect it
  // (anything other than available/in-class is considered a manual override)
  const manualStatuses: FacultyStatus[] = ["on-break", "off-campus", "in-meeting", "do-not-disturb"];
  if (manualStatuses.includes(serverStatus)) {
    return { status: serverStatus, currentPeriod: null, currentLocation: serverLocation };
  }

  if (!schedule || schedule.length === 0) {
    return { status: serverStatus, currentPeriod: null, currentLocation: serverLocation };
  }

  const now = new Date();
  const currentDay = DAYS[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const activeEntry = schedule.find((entry) => {
    if (entry.day !== currentDay) return false;
    const start = timeToMinutes(entry.startTime);
    const end   = timeToMinutes(entry.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  if (activeEntry) {
    return {
      status:          "in-class",
      currentPeriod:   `${activeEntry.subject} (${activeEntry.startTime}–${activeEntry.endTime})`,
      currentLocation: activeEntry.room,
    };
  }

  return { status: "available", currentPeriod: null, currentLocation: serverLocation };
}