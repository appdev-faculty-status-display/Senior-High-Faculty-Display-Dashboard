type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

interface Room {
  id: string | number;
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

const rooms: Room []= [
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

export default function Consultation() {
  return (
    <div className="fixed right-0 top-0 bottom-11 w-60 bg-gray-100 flex flex-col p-4 z-10 overflow-y-auto">
      <h2 className="text-xs font-bold tracking-widest uppercase text-black mb-2">
        Consultation Rooms
      </h2>

      <div className="flex flex-col gap-3 flex-1">
        {rooms.map((room) => (
          <div
            key={room.id + room.status}
            className="bg-white border border-black-200 rounded-none px-5 py-7 flex flex-col flex-1"
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

            <hr className="border-black-100 mb-4" />

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-black font-bold">Time:</span>
                <span className={room.time ? "text-gray-700" : "text-gray-300 tracking-widest"}>
                  {room.time ?? "------"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-black font-bold">Student:</span>
                <span className={room.student ? "text-gray-700" : "text-gray-300 tracking-widest"}>
                  {room.student ?? "--------"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}