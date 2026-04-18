import { Routes, Route } from "react-router-dom"
import FacultyBoard from "./pages/facultyDashboard"
import AdminLogin from "./pages/admin/admin-login"
import RequestForm from "@/pages/requestFormPage";

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<FacultyBoard/>} />
        <Route path="/admin/login" element={<AdminLogin/>} />
        <Route path="/request" element={<RequestForm/>} />
      </Routes>
    </div>
  )
}