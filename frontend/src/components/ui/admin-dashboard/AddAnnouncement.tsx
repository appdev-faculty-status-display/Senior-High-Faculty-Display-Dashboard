import { useState } from "react";
import type { Announcement } from "@/types/announcement";
import { mockAnnouncement } from "@/data/mockAnnouncement";
import AnnouncementTable from "@/components/AnnouncementTable";

export default function AddAnnouncement() {
    const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncement);

    const handleAdd = (announcement: Omit<Announcement, "id">) => {
        const newId = Math.max(...announcements.map(a => a.id), 0) + 1;
        const newAnnouncement = { ...announcement, id: newId };
        setAnnouncements((prev) => [...prev, newAnnouncement]);
    };

    const handleEdit = (updatedAnnouncement: Announcement) => {
        setAnnouncements((prev) =>
            prev.map((announcement) =>
                announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement
            )
        );
    };

    const handleDelete = (id: number) => {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    };

    return (
        <section className="p-6">
        <h2 className="text-2xl font-extrabold text-[#0A3D91] tracking-tight uppercase">
            Add Announcement
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
            Create and manage announcements here.
        </p>

        <AnnouncementTable
            announcements={announcements}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
        </section>
    );
}

console.log("Loaded announcements:", mockAnnouncement);

