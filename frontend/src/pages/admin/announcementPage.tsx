import { useState } from "react";
import type { Announcement } from "@/types/announcement";
import { mockAnnouncement } from "@/data/mockAnnouncement";
import AnnouncementTable from "@/components/AnnouncementTable";

export default function announcementPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncement);

    const handleDelete = (id: number) =>
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));

    const handleAdd = (a: Omit<Announcement, "id">) =>
        setAnnouncements((prev) => [...prev, { ...a, id: Date.now() }]);

    const handleEdit = (updated: Announcement) =>
        setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
        <AnnouncementTable
            announcements={announcements}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onEdit={handleEdit}
        />
        </div>
    );
}