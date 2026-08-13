import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../pages/staff/StaffLayout";

// 🛠️ Đã sửa đường dẫn import: thêm /pages/ vào giữa
import SurveyDashboard from "../pages/staff/survey/SurveyDashboard";
import SurveyJobs from "../pages/staff/survey/SurveyJobs";
import SurveyHistory from "../pages/staff/survey/SurveyHistory";
import SurveyWallet from "../pages/staff/survey/SurveyWallet";
import SurveyStatistics from "../pages/staff/survey/SurveyStatistics";
import SurveyProfile from "../pages/staff/survey/SurveyProfile";

export default function SurveyRoutes({ user, onLogout, showToast }) {
  return (
    <Routes>
      <Route
        element={<StaffLayout user={user} onLogout={onLogout} showToast={showToast} />}
      >
        {/* Tự động chuyển hướng về dashboard nếu vào đường dẫn gốc /staff/survey */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        <Route path="dashboard" element={<SurveyDashboard />} />
        <Route path="jobs" element={<SurveyJobs />} />
        <Route path="history" element={<SurveyHistory />} />
        <Route path="wallet" element={<SurveyWallet />} />
        <Route path="statistics" element={<SurveyStatistics />} />
        <Route path="profile" element={<SurveyProfile />} />
      </Route>
    </Routes>
  );
}