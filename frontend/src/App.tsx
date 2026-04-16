import { Routes, Route } from "react-router-dom"
import FacultyBoardDemo from "./pages/facultyCardDemo"
import AdminLogin from "./pages/admin/admin-login"

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<FacultyBoardDemo/>} />
        <Route path="/admin/login" element={<AdminLogin/>} />
      </Routes>
    </div>
  )
}