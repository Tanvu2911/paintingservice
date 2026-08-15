import { Routes, Route, Navigate } from "react-router-dom";
import CustomerLayout from "../pages/customer/CustomerLayout";
import CustomerHistory from "../pages/customer/CustomerHistory";
import CustomerProfile from "../pages/customer/CustomerProfile";
import CustomerWallet from "../pages/customer/CustomerWallet";
import CustomerDashboard from "../pages/customer/CustomerDashboard";
import CustomerBooking from "../pages/customer/CustomerBooking";
import OngoingBookings from "../pages/customer/CustomerOngoing";

export default function CustomerRoutes({ user, onLogout, showToast }) {
  return (
    <Routes>
      <Route
        element={
          <CustomerLayout user={user} onLogout={onLogout} showToast={showToast} />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="booking" element={<CustomerBooking />} />
        <Route path="ongoing" element={<OngoingBookings />} />
        <Route path="history" element={<CustomerHistory />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="wallet" element={<CustomerWallet />} />
      </Route>
    </Routes>
  );
}
