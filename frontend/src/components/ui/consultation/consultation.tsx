import { useEffect, useMemo, useRef } from 'react';
import { useConsultationRooms } from '@/hooks/useConsultation';
import type { ConsultationRoom } from '@/lib/consultationApi';

const POLL_INTERVAL = 5_000;

type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

interface RoomViewModel {
  id: string;
  status: RoomStatus;
  teacher: string | null;
  strand: string | null;
  time: string | null;
  student: string | null;
}

const badgeClass: Record<RoomStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-red-100 text-red-800',
  RESERVED: 'bg-blue-100 text-blue-800',
};

function toRoomView(room: ConsultationRoom): RoomViewModel {
  const status: RoomStatus = room.isActive
    ? room.currentOccupant
      ? 'OCCUPIED'
      : 'RESERVED'
    : 'AVAILABLE';

  return {
    id: room.roomCode,
    status,
    teacher: room.currentOccupant?.name ?? null,
    strand: room.location || null,
    time: room.occupiedUntil ? new Date(room.occupiedUntil).toLocaleString() : null,
    student: room.currentOccupant?.id ?? null,
  };
}

export default function Consultation() {
  const { rooms, loading, error, fetchRooms, available } = useConsultationRooms();

  const fetchRef = useRef(fetchRooms);
  useEffect(() => {
    fetchRef.current = fetchRooms;
  }, [fetchRooms]);

  useEffect(() => {
    void fetchRef.current();
    const id = window.setInterval(() => void fetchRef.current(), POLL_INTERVAL);
    return () => window.clearInterval(id);
  }, []);

  const roomCards = useMemo(() => rooms.map(toRoomView), [rooms]);

  return (
    <aside className="w-64 bg-gray-100 flex flex-col p-4 border-l border-gray-200 top-16 h-[calc(100vh-4rem)] overflow-y-auto self-start">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-widest uppercase text-black">
          Consultation Rooms
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
          {available} available
        </span>
      </div>

      {loading && (
        <div className="mb-4 rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
          Loading consultation rooms...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-7">
        {roomCards.map((room) => (
          <div
            key={`${room.id}-${room.status}`}
            className="bg-white border border-gray-200 rounded-none px-5 py-7 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-black">{room.id}</span>
              <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-none ${badgeClass[room.status]}`}>
                {room.status}
              </span>
            </div>

            <div className="mb-10">
              {room.teacher ? (
                <>
                  <p className="text-sm font-medium text-black">{room.teacher}</p>
                  <p className="text-xs text-gray-700">{room.strand}</p>
                </>
              ) : (
                <>
                  <p className="text-xs tracking-widest text-gray-300">-------</p>
                  <p className="text-xs tracking-widest text-gray-300">----</p>
                </>
              )}
            </div>

            <hr className="border-gray-100 mb-4" />

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-black font-bold">Time:</span>
                <span className={room.time ? 'text-gray-700' : 'text-gray-300 tracking-widest'}>
                  {room.time ?? '------'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-black font-bold">Student:</span>
                <span className={room.student ? 'text-gray-700' : 'text-gray-300 tracking-widest'}>
                  {room.student ?? '--------'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}