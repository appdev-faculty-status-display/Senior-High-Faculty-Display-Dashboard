import { FacultyCard } from "@/components/ui/faculty-card/faculty-card";
import { MOCK_FACULTY } from "@/data/mockFaculty";
import Header from "@/components/ui/header/header";
import Consultation from "@/components/ui/consultation/consultation";
import Footer from "@/components/ui/footer/footer";

export default function FacultyBoard() {
  const stemFaculty = MOCK_FACULTY.filter((f) => f.strand === "STEM");
  const abmFaculty = MOCK_FACULTY.filter((f) => f.strand === "ABM");
  const humssFaculty = MOCK_FACULTY.filter((f) => f.strand === "HUMSS");

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Header variant="default" />

      <div className="flex flex-1 overflow-hidden">

        <main className="flex-1 overflow-y-auto px-10 py-4">
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