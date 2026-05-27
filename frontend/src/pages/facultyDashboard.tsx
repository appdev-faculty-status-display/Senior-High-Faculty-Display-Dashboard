import { FacultyCard } from "@/components/ui/faculty-card/faculty-card";
import { useState, useEffect, useCallback } from "react";
import { getFacultyList } from "@/lib/facultyApi";
import type { Faculty } from "@/types/faculty-states";
import { deriveStatusFromSchedule } from "@/utils/schedule-utils";
import Header from "@/components/ui/header/header";
import Consultation from "@/components/ui/consultation/consultation";
import Footer from "@/components/ui/footer/footer";

const  POLL_INTERVAL = 60 * 1000; // 60 seconds in milliseconds

function applySchedule(raw: Faculty[]): Faculty[] {
  return raw.map((f) => {
    const derived = deriveStatusFromSchedule(f.schedule, f.status, f.currentLocation);
    return {
      ...f,
      status:          derived.status,
      currentPeriod:   derived.currentPeriod   ?? f.currentPeriod,
      currentLocation: derived.currentLocation ?? f.currentLocation,
    };
  });
}

export default function FacultyBoard() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);

  const fetchAndApply = useCallback(() => {
    getFacultyList()
      .then((res) => {
        const mapped: Faculty[] = res.data.map((f) => ({
          id:                f.id,
          name:              f.name,
          role:              f.role as Faculty["role"],
          strand:            f.strand as Faculty["strand"],
          photoUrl:          "",
          status:            f.currentStatus as Faculty["status"],
          currentLocation:   f.currentRoom ?? "TBD",
          consultationHours: f.consultationHours,
          schedule:          f.schedule as Faculty["schedule"],
        }));
        setFaculty(applySchedule(mapped));
      })
      .catch(() => {});
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchAndApply();
    const interval = setInterval(fetchAndApply, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAndApply]);

  // Re-derive every minute without a network call
  // (handles the case where a class starts between polls)
  useEffect(() => {
    const tick = setInterval(() => {
      setFaculty((prev) => applySchedule(prev));
    }, 60_000);
    return () => clearInterval(tick);
  }, []);

  const stemFaculty  = faculty.filter((f) => f.strand === "STEM" && f.role !== "principal");
  const abmFaculty   = faculty.filter((f) => f.strand === "ABM" && f.role !== "principal");
  const humssFaculty = faculty.filter((f) => f.strand === "HUMSS" && f.role !== "principal");


  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Header variant="default" />

      <div className="flex flex-1 overflow-hidden">

        <main className="flex-1 overflow-y-auto px-4 py-3">
          <section className="mb-4">
            <h2 className="font-bold tracking-tight text-do-not-disturb mt-2 mb-3">
              STEM
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {stemFaculty.map((faculty) => (
                <FacultyCard key={faculty.id} faculty={faculty} />
              ))}
            </div>
          </section>

          <section className="mb-4">
            <h2 className="font-bold tracking-tight text-available mt-2 mb-3">
              ABM
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {abmFaculty.map((faculty) => (
                <FacultyCard key={faculty.id} faculty={faculty} />
              ))}
            </div>
          </section>

          <section className="mb-4">
            <h2 className="font-bold tracking-tight text-secondary mt-2 mb-3">
              HUMSS
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {humssFaculty.map((faculty) => (
                <FacultyCard key={faculty.id} faculty={faculty} />
              ))}
            </div>
          </section>
        </main>

        <Consultation />

      </div>

      <Footer />

    </div>
  );
}