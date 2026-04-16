import { rooms, badgeClass } from "@/data/mockConsultationRoom"; 

export default function Consultation() {
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
              <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-none ${badgeClass[room.status]}`}>
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
    </aside>
  );
}