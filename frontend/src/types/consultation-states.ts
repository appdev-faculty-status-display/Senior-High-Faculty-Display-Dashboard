export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface Room {
  id: string | number;
  status: RoomStatus;
  teacher: string | null;
  strand: string | null;
  time: string | null;
  student: string | null;
}