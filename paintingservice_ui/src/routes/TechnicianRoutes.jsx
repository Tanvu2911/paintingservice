import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../pages/staff/StaffLayout";

// Import các trang Thợ thi công từ src/pages/staff/technician/
import TechnicianDashboard from "../pages/staff/technician/TechnicianDashboard";
import TechnicianJobs from "../pages/staff/technician/TechnicianJobs";
import TechnicianHistory from "../pages/staff/technician/TechnicianHistory";
import TechnicianWallet from "../pages/staff/technician/TechnicianWallet";
import TechnicianStatistics from "../pages/staff/technician/TechnicianStatistics";
import TechnicianProfile from "../pages/staff/technician/TechnicianProfile";
import StaffReviewsPage from "../pages/staff/reviews/StaffReviewsPage";

export default function TechnicianRoutes({ user, onLogout, showToast }) {
  return (
    <Routes>
      <Route
        element={<StaffLayout user={user} onLogout={onLogout} showToast={showToast} />}
      >
        {/* Tự động chuyển hướng về dashboard nếu vào đường dẫn gốc /staff/technician */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        <Route path="dashboard" element={<TechnicianDashboard />} />
        <Route path="jobs" element={<TechnicianJobs />} />
        <Route path="history" element={<TechnicianHistory />} />
        <Route path="wallet" element={<TechnicianWallet />} />
        <Route path="statistics" element={<TechnicianStatistics />} />
        <Route path="reviews" element={<StaffReviewsPage />} />
        <Route path="profile" element={<TechnicianProfile />} />
      </Route>
    </Routes>
  );
}