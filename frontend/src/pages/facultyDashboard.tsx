import { FacultyCard } from "@/components/ui/faculty-card/faculty-card";
import { useEffect, useMemo, useRef } from 'react';
import { useFaculty } from '@/hooks/useFaculty';
import type { FacultyCard as ApiFacultyCard } from '@/lib/facultyApi';
import type { Faculty as FacultyViewModel } from '@/types/faculty-states';
import Header from "@/components/ui/header/header";
import Consultation from "@/components/ui/consultation/consultation";
import Footer from "@/components/ui/footer/footer";

const POLL_INTERVAL = 5_000;

const DEFAULT_PHOTO_URL = 'https://ui-avatars.com/api/?name=Faculty&background=002f73&color=ffffff';

function toFacultyCard(faculty: ApiFacultyCard): FacultyViewModel {
  return {
    id: faculty.id,
    name: faculty.name,
    strand: faculty.strand as FacultyViewModel['strand'],
    photoUrl: DEFAULT_PHOTO_URL,
    status: faculty.currentStatus.replace(/_/g, '-') as FacultyViewModel['status'],
    currentLocation: faculty.currentRoom ?? 'Room Not Set',
    subject: faculty.subjects[0],
    consultationHours: faculty.consultationHours[0]
      ? {
          start: faculty.consultationHours[0].startTime,
          end: faculty.consultationHours[0].endTime,
        }
      : undefined,
    currentPeriod: faculty.schedule[0]?.subject,
  };
}

export default function FacultyBoard() {
  const { faculty, loading, error, fetchFaculty } = useFaculty({ pollInterval: POLL_INTERVAL });

  const fetchRef = useRef(fetchFaculty);
  useEffect(() => { fetchRef.current = fetchFaculty; }, [fetchFaculty]);
  useEffect(() => {
    void fetchRef.current();
    const id = window.setInterval(() => void fetchRef.current(), POLL_INTERVAL);
    return () => window.clearInterval(id);
  }, []);

  const facultyCards = useMemo(() => faculty.map(toFacultyCard), [faculty]);

  const stemFaculty = facultyCards.filter((f) => f.strand === 'STEM');
  const abmFaculty = facultyCards.filter((f) => f.strand === 'ABM');
  const humssFaculty = facultyCards.filter((f) => f.strand === 'HUMSS');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Header variant="default" />

      <div className="flex flex-1 overflow-hidden">

        <main className="flex-1 overflow-y-auto px-10 py-4">
          {loading && (
            <div className="mb-4 rounded-md border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#4f4f4f]">
              Loading faculty board...
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">
              {error}
            </div>
          )}

          <section className="mb-6">
            <h2 className="font-bold tracking-tight text-secondary mt-2 mb-3">
              STEM
            </h2>
            <div className="grid grid-cols-6 gap-5">
              {stemFaculty.map((faculty) => (
                <FacultyCard key={faculty.id} faculty={faculty} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-bold tracking-tight text-do-not-disturb mt-2 mb-3">
              ABM
            </h2>
            <div className="grid grid-cols-6 gap-5">
              {abmFaculty.map((faculty) => (
                <FacultyCard key={faculty.id} faculty={faculty} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-bold tracking-tight text-available mt-2 mb-3">
              HUMSS
            </h2>
            <div className="grid grid-cols-6 gap-5">
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