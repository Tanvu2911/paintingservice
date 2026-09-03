import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../pages/customer/CustomerLayout";
import PageLoadingFallback from "../components/common/PageLoadingFallback";

const CustomerProfile = lazy(() => import("../pages/customer/CustomerProfile"));
const CustomerWallet = lazy(() => import("../pages/customer/CustomerWallet"));
const CustomerDashboard = lazy(() => import("../pages/customer/CustomerDashboard"));
const CustomerBooking = lazy(() => import("../pages/customer/CustomerBooking"));
const OngoingBookings = lazy(() => import("../pages/customer/CustomerOngoing"));
const VNPayCallback = lazy(() => import("../pages/customer/VNPayCallback"));
const BookingDetail = lazy(() => import("../pages/customer/BookingDetail"));

export default function CustomerRoutes({ user, onLogout, showToast }) {
  return (
    <Suspense fallback={<PageLoadingFallback message="Đang tải dữ liệu khách hàng..." />}>
      <Routes>
        <Route path="payment-callback" element={<VNPayCallback />} />
        <Route
          element={
            <CustomerLayout user={user} onLogout={onLogout} showToast={showToast} />
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="booking" element={<CustomerBooking />} />
          <Route path="ongoing" element={<OngoingBookings />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="orders/:id" element={<BookingDetail />} />
          <Route path="history" element={<Navigate to="/customer/ongoing" replace />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="wallet" element={<CustomerWallet />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

