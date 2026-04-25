import type { Announcement } from "../types/announcement";

export const mockAnnouncement: Announcement[] = [
    {
        id: 1,
        title: "Faculty on Leave",
        message: "Mr. Elon is on sick leave today.",
        datePosted: new Date("2026-04-06T08:14:00").toISOString(),

    },
    {
        id: 2,
        title: "Department Meeting",
        message: "Mr. Socrates is in a meeting around 1–3 pm.",
        datePosted: new Date("2026-04-06T08:14:00").toISOString(),
    },
    {
        id: 3,
        title: "Campus Duty",
        message: "Ms. Curie will be available after 2 pm due to university's head visit.",
        datePosted: new Date("2026-04-06T08:14:00").toISOString(),
    },
    ];