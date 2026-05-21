import { Routes, Route } from "react-router-dom";
import FacultyBoard from "./pages/facultyDashboard";
import AdminLogin from "./pages/admin/admin-login";
import AdminBoard from "./pages/admin/adminDashboard";
import RequestForm from "./pages/requestFormPage";
import AddSchedule from "./components/ui/admin-dashboard/addSchedule"; 
import AddAnnouncement from "./components/ui/admin-dashboard/AddAnnouncement";

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<FacultyBoard />} />
        <Route path="/request" element={<RequestForm />} />
        
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminBoard />} />
        <Route path="/admin/add-schedule" element={<AddSchedule />} />
        <Route path="/admin/add-announcement" element={<AddAnnouncement />} />
      </Routes>
    </div>
  );
}
