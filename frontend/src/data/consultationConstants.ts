import type { Room, RoomStatus } from '@/types/consultation-states';

export const ROOM_STATUS_STYLES: Record<RoomStatus, string> = {
    AVAILABLE: 'bg-green-100 text-green-800',
    OCCUPIED: 'bg-red-100 text-red-800',
    RESERVED: 'bg-blue-100 text-blue-800',
};

export const DEFAULT_ROOMS: Room[] = [
    {
        id: "CR-01",
        status: "AVAILABLE",
        teacher: null,
        strand: null,
        time: null,
        student: null,
    },
    {
        id: "CR-02",
        status: "AVAILABLE",
        teacher: null,
        strand: null,
        time: null,
        student: null,
    },
    {
        id: "CR-03",
        status: "AVAILABLE",
        teacher: null,
        strand: null,
        time: null,
        student: null,
    },
];
