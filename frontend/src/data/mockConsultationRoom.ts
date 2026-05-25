import type { Room, RoomStatus } from "@/types/consultation-states";


export const rooms: Room[] = [
  {
    id: "CR-01",
    status: "OCCUPIED",
    teacher: "Krisha Agojo",
    strand: "ABM",
    time: "9:30am - 10:45am",
    student: "Eli Panopio",
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
    status: "RESERVED",
    teacher: "Keith Robles",
    strand: "STEM",
    time: "9:30am - 10:45am",
    student: "Matthew Jompilla",
  },
];

export const badgeClass: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-red-100 text-red-800',
  RESERVED: 'bg-blue-100 text-blue-800',
};

