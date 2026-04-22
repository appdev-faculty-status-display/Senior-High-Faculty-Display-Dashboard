import type { Status } from "@/types/schedule";

interface Props {
    status: Status;
}

export default function StatusBadge({ status }: Props) {
    const styles: Record<Status, string> = {
        "IN CLASS": "border border-yellow-400 text-yellow-500 bg-yellow-50",
        AVAILABLE: "border border-green-400 text-green-600 bg-green-50",
        "OFF CAMPUS": "border border-orange-400 text-orange-500 bg-orange-50",
        "ON BREAK": "border border-blue-400 text-blue-600 bg-blue-50",
        "IN MEETING": "border border-purple-400 text-purple-600 bg-purple-50",
        "DO NOT DISTURB": "border border-red-400 text-red-600 bg-red-50",
    };

    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${styles[status]}`}>
        {status}
        </span>
    );
}