import { Routes, Route } from "react-router-dom";
import FacultyBoard from "./pages/facultyDashboard";
import AdminLogin from "./pages/admin/admin-login";
import AdminBoard from "./pages/adminDashboard";
import RequestForm from "./pages/requestFormPage";
import AddSchedule from "./components/ui/admin-dashboard/addSchedule"; 
import AddAnnouncement from "./components/ui/admin-dashboard/AddAnnouncement";

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<FacultyBoard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/request" element={<RequestForm />} />
        <Route path="/admin" element={<AdminBoard />}>
          <Route path="add-schedule" element={<AddSchedule />} />
          <Route path="add-announcement" element={<AddAnnouncement />} />
        </Route>
      </Routes>
    </div>
  );
}
