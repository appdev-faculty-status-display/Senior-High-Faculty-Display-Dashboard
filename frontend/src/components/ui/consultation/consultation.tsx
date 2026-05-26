import { useEffect, useState, useRef } from 'react';
import { getApprovedConsultations } from '@/lib/consultationApi';
import type { ApprovedConsultation } from '@/lib/consultationApi';
import { ROOM_STATUS_STYLES, DEFAULT_ROOMS } from '@/data/consultationConstants';
import type { RoomStatus } from '@/types/consultation-states';

interface Room {
  id: string | number;
  status: RoomStatus;
  teacher: string | null;
  strand: string | null;
  time: string | null;
  student: string | null;
}

function isConsultationTimeExpired(timeString: string | null): boolean {
  if (!timeString) return false;

  // Parse time string format "HH:MM AM/PM – HH:MM AM/PM"
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[\s\-–—]+\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
  const match = timeString.match(timePattern);

  if (!match) {
    console.warn(`Failed to parse time: ${timeString}`);
    return false;
  }

  const endHour = parseInt(match[4], 10);
  const endMinute = parseInt(match[5], 10);
  const endPeriod = match[6].toUpperCase();

  // Convert to 24-hour format
  let endHour24 = endHour;
  if (endPeriod === 'PM' && endHour24 !== 12) {
    endHour24 += 12;
  } else if (endPeriod === 'AM' && endHour24 === 12) {
    endHour24 = 0;
  }

  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const endTimeInMinutes = endHour24 * 60 + endMinute;

  // Return true if expired (current time >= end time)
  return currentTimeInMinutes >= endTimeInMinutes;
}

function isConsultationOngoing(timeString: string | null): boolean {
  if (!timeString) return false;

  // Parse time string format "HH:MM AM/PM – HH:MM AM/PM"
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[\s\-–—]+\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i;
  const match = timeString.match(timePattern);

  if (!match) return false;

  const startHour = parseInt(match[1], 10);
  const startMinute = parseInt(match[2], 10);
  const startPeriod = match[3].toUpperCase();

  const endHour = parseInt(match[4], 10);
  const endMinute = parseInt(match[5], 10);
  const endPeriod = match[6].toUpperCase();

  // Convert to 24-hour format
  let startHour24 = startHour;
  if (startPeriod === 'PM' && startHour24 !== 12) {
    startHour24 += 12;
  } else if (startPeriod === 'AM' && startHour24 === 12) {
    startHour24 = 0;
  }

  let endHour24 = endHour;
  if (endPeriod === 'PM' && endHour24 !== 12) {
    endHour24 += 12;
  } else if (endPeriod === 'AM' && endHour24 === 12) {
    endHour24 = 0;
  }

  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const startTimeInMinutes = startHour24 * 60 + startMinute;
  const endTimeInMinutes = endHour24 * 60 + endMinute;

  // Debug logging
  console.log(`Time check for ${timeString}:`, {
    currentTime: `${currentHour}:${String(currentMinute).padStart(2, '0')} (${currentTimeInMinutes} mins)`,
    startTime: `${startHour24}:${String(startMinute).padStart(2, '0')} (${startTimeInMinutes} mins)`,
    endTime: `${endHour24}:${String(endMinute).padStart(2, '0')} (${endTimeInMinutes} mins)`,
    isOngoing: currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes
  });

  // Return true if current time is within the consultation period
  return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
}

// Helper function to filter out expired consultations
function filterExpiredConsultations(consultations: ApprovedConsultation[]): ApprovedConsultation[] {
  return consultations.filter(consultation => {
    const isExpired = isConsultationTimeExpired(consultation.time);
    if (isExpired) {
      console.log(`Consultation for ${consultation.room} expired at ${consultation.time}`);
    } else {
      console.log(`Consultation for ${consultation.room} is still active until ${consultation.time}`);
    }
    return !isExpired;
  });
}

export default function Consultation() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const fetchApprovedConsultations = async () => {
      try {
        // Only show loading on initial load
        if (isInitialLoadRef.current) {
          setLoading(true);
        }
        const response = await getApprovedConsultations();

        console.log('API Response:', response);
        console.log('Consultations from API:', response.data);

        // Filter out expired consultations
        const validConsultations = filterExpiredConsultations(response.data);

        console.log('Valid consultations after filtering:', validConsultations);

        // Transform fetched consultations
        const activeConsultations = validConsultations.map((consultation: ApprovedConsultation) => {
          const isOngoing = isConsultationOngoing(consultation.time);
          return {
            id: consultation.room,
            status: (isOngoing ? 'OCCUPIED' : 'RESERVED') as RoomStatus,
            teacher: consultation.teacher || null,
            strand: consultation.strand || null,
            time: consultation.time || null,
            student: consultation.studentName || null,
          };
        });

        console.log('Transformed consultations:', activeConsultations);

        // Create a map of active consultations by room ID
        const activeMap = new Map(activeConsultations.map(room => [room.id, room]));

        console.log('Active map:', Array.from(activeMap.entries()));

        // Merge with DEFAULT_ROOMS: use active consultations if available, otherwise use default room
        const mergedRooms = DEFAULT_ROOMS.map(mockRoom =>
          activeMap.get(String(mockRoom.id)) || (mockRoom as Room)
        );

        console.log('Merged rooms:', mergedRooms);

        setRooms(mergedRooms as Room[]);
      } catch (err) {
        console.error('Failed to fetch approved consultations:', err);
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        console.error('Full error details:', errorMessage);
        console.error('Error object:', err);
        // Fallback to default rooms on error
        setRooms(DEFAULT_ROOMS as Room[]);
      } finally {
        if (isInitialLoadRef.current) {
          setLoading(false);
          isInitialLoadRef.current = false;
        }
      }
    };

    fetchApprovedConsultations();

    const interval = setInterval(fetchApprovedConsultations, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <aside className="w-64 bg-gray-100 flex flex-col p-4 border-l border-gray-200 top-16 h-[calc(100vh-4rem)] overflow-y-auto self-start">
        <h2 className="text-base font-bold tracking-widest uppercase text-black mb-2">
          Consultation Rooms
        </h2>
        <div className="text-sm text-gray-500">Loading...</div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-gray-100 flex flex-col p-4 border-l border-gray-200 top-16 h-[calc(100vh-4rem)] overflow-y-auto self-start">
      <h2 className="text-base font-bold tracking-widest uppercase text-black mb-2">
        Consultation Rooms
      </h2>

      <div className="flex flex-col gap-7">
        {rooms.map((room) => (
          <div
            key={`${room.id}-${room.status}`}
            className="bg-white border border-gray-200 rounded-none px-5 py-7 flex flex-col"
          >
            {/* Header: Room ID and Status */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-black">{room.id}</span>
              <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-none ${ROOM_STATUS_STYLES[room.status]}`}>
                {room.status}
              </span>
            </div>

            {/* Teacher and Strand Info */}
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

            {/* Footer: Time and Student Info */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-start text-xs gap-2">
                <span className="text-black font-bold flex-shrink-0">Time:</span>
                <span className={`text-right truncate ${room.time ? "text-gray-700" : "text-gray-300 tracking-widest"}`}>
                  {room.time ?? "------"}
                </span>
              </div>
              <div className="flex justify-between items-start text-xs gap-2">
                <span className="text-black font-bold flex-shrink-0">Student:</span>
                <span className={`text-right line-clamp-2 ${room.student ? "text-gray-700" : "text-gray-300 tracking-widest"}`}>
                  {room.student ?? "--------"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}