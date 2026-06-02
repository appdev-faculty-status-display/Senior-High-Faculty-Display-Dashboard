import { Routes, Route } from "react-router-dom";
import FacultyBoard from "./pages/facultyDashboard";
import AdminLogin from "./pages/admin/admin-login";
import AdminBoard from "./pages/admin/adminDashboard";
import RequestForm from "./pages/requestFormPage";
import StatusPage from "./pages/statusPage";
import FacultyRequestForm from "./pages/faculty/facultyRequestFormPage";
import FacultyStatusPage from "./pages/faculty/facultyStatusPage";
import AddSchedule from "./components/ui/admin-dashboard/addSchedule";
import ProtectedRoute from "./components/routing/ProtectedRoute";
// import AddAnnouncement from "./components/ui/admin-dashboard/AddAnnouncement";

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<FacultyBoard />} />
        <Route path="/request" element={<RequestForm />} />
        <Route path="/request/faculty" element={<FacultyRequestForm />} />
        {/* Confirmation pages removed - workflow shows confirmation */}
        <Route path="/status" element={<StatusPage />} />
        <Route path="/status/faculty" element={<FacultyStatusPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute allowedRoles={["principal", "strand_head"]} />}>
          <Route path="/admin/dashboard" element={<AdminBoard />} />
          <Route path="/admin/add-schedule" element={<AddSchedule />} />
        </Route>
      </Routes>
    </div>
  );
}