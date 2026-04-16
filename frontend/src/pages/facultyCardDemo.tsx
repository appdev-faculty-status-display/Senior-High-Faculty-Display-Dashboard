import { FacultyCard } from "../components/ui/faculty-card/faculty-card";
import { MOCK_FACULTY } from "../data/mockFaculty";
import Header from "../components/ui/header/header";
import Consultation from "@/components/ui/consultation/consultation";
import Footer from "@/components/ui/footer/footer";

export default function FacultyCardDemo() {

  const stemFaculty = MOCK_FACULTY.filter((f) => f.strand === "STEM");
  const abmFaculty = MOCK_FACULTY.filter((f) => f.strand === "ABM");
  const humssFaculty = MOCK_FACULTY.filter((f) => f.strand === "HUMSS");

  return (
    <main className="min-h-screen bg-background">
      <Header variant="default" />

      <div className="mx-auto w-4/5 max-h-250">

        <section>
          <h2 className="font-bold tracking-tight text-secondary mt-2">
            STEM
          </h2>
          <div className="grid grid-cols-6 gap-5 ">
            {stemFaculty.map((faculty) => (
              <FacultyCard key={faculty.id} faculty={faculty} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-bold tracking-tight text-do-not-disturb mt-2">
            ABM
          </h2>
          <div className="grid grid-cols-6 gap-5 ">
            {abmFaculty.map((faculty) => (
              <FacultyCard key={faculty.id} faculty={faculty} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-bold tracking-tight text-available mt-2">
            HUMSS
          </h2>
          <div className="grid grid-cols-6 gap-5">
            {humssFaculty.map((faculty) => (
              <FacultyCard key={faculty.id} faculty={faculty} />
            ))}
          </div>
        </section>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6 ">
          {MOCK_FACULTY.map((faculty) => (
            <FacultyCard key={faculty.id} faculty={faculty} />
          ))}
        </div>

      </div>

    <Footer/>
    </main>
  );
}