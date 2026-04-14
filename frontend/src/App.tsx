import { Routes, Route } from "react-router-dom"
import FacultyBoardDemo from "./pages/facultyCardDemo"

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<FacultyBoardDemo/>} />
      </Routes>
    </div>
  )
}