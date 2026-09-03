import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "../pages/staff/StaffLayout";
import PageLoadingFallback from "../components/common/PageLoadingFallback";

const SurveyDashboard = lazy(() => import("../pages/staff/survey/SurveyDashboard"));
const SurveyJobs = lazy(() => import("../pages/staff/survey/SurveyJobs"));
const SurveyHistory = lazy(() => import("../pages/staff/survey/SurveyHistory"));
const SurveyWallet = lazy(() => import("../pages/staff/survey/SurveyWallet"));
const SurveyStatistics = lazy(() => import("../pages/staff/survey/SurveyStatistics"));
const SurveyProfile = lazy(() => import("../pages/staff/survey/SurveyProfile"));
const StaffReviewsPage = lazy(() => import("../pages/staff/reviews/StaffReviewsPage"));
const StaffWarrantyJobs = lazy(() => import("../pages/staff/components/StaffWarrantyJobs"));

export default function SurveyRoutes({ user, onLogout, showToast }) {
  return (
    <Suspense fallback={<PageLoadingFallback message="Đang tải dữ liệu giám sát..." />}>
      <Routes>
        <Route
          element={<StaffLayout user={user} onLogout={onLogout} showToast={showToast} />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          
          <Route path="dashboard" element={<SurveyDashboard />} />
          <Route path="jobs" element={<SurveyJobs />} />
          <Route path="warranties" element={<StaffWarrantyJobs role="survey" />} />
          <Route path="history" element={<SurveyHistory />} />
          <Route path="wallet" element={<SurveyWallet />} />
          <Route path="statistics" element={<SurveyStatistics />} />
          <Route path="reviews" element={<StaffReviewsPage />} />
          <Route path="profile" element={<SurveyProfile />} />
        </Route>
      </Routes>
    </Suspense>
  );
}