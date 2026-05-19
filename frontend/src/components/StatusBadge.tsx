import type { Status } from "@/types/schedule";

interface Props {
    status: string; 
}

const styles: Record<Status, string> = {
    "IN CLASS": "text-yellow-500 bg-yellow-100",
    "AVAILABLE": "text-green-600 bg-green-100",
    "OFF CAMPUS": "text-orange-500 bg-orange-100",
    "ON BREAK": "text-blue-600 bg-blue-100",
    "IN MEETING": "text-purple-600 bg-purple-100",
    "DO NOT DISTURB": "text-red-600 bg-red-100",
    };

    export default function StatusBadge({ status }: Props) {
    const normalized = status.toUpperCase() as Status;
    const style = styles[normalized] ?? "bg-gray-200 text-gray-700";

    return (
        <span
        className={`px-2.5 py-1 text-[10px] font-bold uppercase ${style}`}
        >
        {normalized}
        </span>
    );
}
