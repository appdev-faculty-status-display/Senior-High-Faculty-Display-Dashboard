// announcementPage.tsx
import AnnouncementTable from "@/components/AnnouncementTable";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { type CreateAnnouncementBody } from "@/types/announcement";
import { useAuth } from "@/hooks/useAuth";

export default function AnnouncementPage() {  
    const { getToken } = useAuth();
    const token = getToken() ?? undefined;

    const {
        announcements,
        total,
        page,
        loading,
        error,
        add,
        remove,
        setPage,
    } = useAnnouncements({ token, pageSize: 20 });

    async function handleAdd(draft: CreateAnnouncementBody) {
        try {
            await add(draft);
        } catch (err) {
            console.error((err as Error).message);
        }
    }

    async function handleDelete(id: string) {
        try {
            await remove(id);
        } catch (err) {
            console.error((err as Error).message);
        }
    }


    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {error && (
                <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-200">
                    {error}
                </p>
            )}
            <AnnouncementTable
                announcements={announcements}
                total={total}
                page={page}
                loading={loading}
                error={error}
                onDelete={handleDelete}
                onAdd={handleAdd}
                onPageChange={setPage}
            />
        </div>
    );
}