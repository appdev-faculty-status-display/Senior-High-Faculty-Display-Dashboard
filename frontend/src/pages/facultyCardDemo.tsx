import { FacultyCard } from "../components/ui/faculty-card/faculty-card";
import { MOCK_FACULTY } from "../data/mockFaculty";

export default function FacultyCardDemo() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-4/5">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-black">
            Faculty Board (Sample Header)
          </h1>
          <p className="mt-1 text-sm text-dark-gray">
            NU Laguna Senior High School — Real-time faculty availability
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {MOCK_FACULTY.map((faculty) => (
            <FacultyCard key={faculty.id} faculty={faculty} />
          ))}
        </div>
      </div>
    </main>
  );
}