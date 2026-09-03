import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../pages/staff/StaffLayout";
import PageLoadingFallback from "../components/common/PageLoadingFallback";

const TechnicianDashboard = lazy(() => import("../pages/staff/technician/TechnicianDashboard"));
const TechnicianJobs = lazy(() => import("../pages/staff/technician/TechnicianJobs"));
const TechnicianHistory = lazy(() => import("../pages/staff/technician/TechnicianHistory"));
const TechnicianWallet = lazy(() => import("../pages/staff/technician/TechnicianWallet"));
const TechnicianStatistics = lazy(() => import("../pages/staff/technician/TechnicianStatistics"));
const TechnicianProfile = lazy(() => import("../pages/staff/technician/TechnicianProfile"));
const StaffReviewsPage = lazy(() => import("../pages/staff/reviews/StaffReviewsPage"));
const StaffWarrantyJobs = lazy(() => import("../pages/staff/components/StaffWarrantyJobs"));

export default function TechnicianRoutes({ user, onLogout, showToast }) {
  return (
    <Suspense fallback={<PageLoadingFallback message="Đang tải dữ liệu kỹ thuật viên..." />}>
      <Routes>
        <Route
          element={<StaffLayout user={user} onLogout={onLogout} showToast={showToast} />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          
          <Route path="dashboard" element={<TechnicianDashboard />} />
          <Route path="jobs" element={<TechnicianJobs />} />
          <Route path="warranties" element={<StaffWarrantyJobs role="technician" />} />
          <Route path="history" element={<TechnicianHistory />} />
          <Route path="wallet" element={<TechnicianWallet />} />
          <Route path="statistics" element={<TechnicianStatistics />} />
          <Route path="reviews" element={<StaffReviewsPage />} />
          <Route path="profile" element={<TechnicianProfile />} />
        </Route>
      </Routes>
    </Suspense>
  );
}