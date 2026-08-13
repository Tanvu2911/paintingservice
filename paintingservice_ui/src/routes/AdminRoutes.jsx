import { Routes, Route } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import EmployeeManagement from "../pages/admin/employees/EmployeeManagement";
import CustomerManagement from "../pages/admin/customers/CustomerManagement";
import OrderList from "../pages/admin/orders/OrderList";
import OrderDetail from "../pages/admin/orders/OrderDetail";
import ContractManagement from "../pages/admin/contracts/ContractManagement";
import PaymentToStaff from "../pages/admin/payments/PaymentToStaff";
import PaintingDashboard from "../pages/admin/painting/PaintingDashboard";
import PaintingRequestList from "../pages/admin/painting/PaintingRequestList";
import QuotationPage from "../pages/admin/painting/QuotationPage";
import ProgressTrackingPage from "../pages/admin/painting/ProgressTrackingPage";
import InspectionPage from "../pages/admin/painting/InspectionPage";

export default function AdminRoutes({ user, onLogout, showToast }) {
  return (
    <Routes>
      <Route
        element={<AdminLayout user={user} onLogout={onLogout} showToast={showToast} />}
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
  {/* 1. Hỗ trợ URL mới /admin/bookings */}
        <Route path="bookings" element={<OrderList />} />
        <Route path="bookings/:id" element={<OrderDetail />} />

        {/* 2. Hỗ trợ URL cũ /admin/orders (Giúp không bao giờ bị trang trắng nếu lỡ click link cũ) */}
        {/* <Route path="orders" element={<OrderList />} /> */}
        {/* <Route path="orders/:id" element={<OrderDetail />} /> */}
        <Route path="contracts" element={<ContractManagement />} />
        <Route path="payments" element={<PaymentToStaff />} />
        <Route path="painting" element={<PaintingDashboard />} />
        <Route path="painting/requests" element={<PaintingRequestList />} />
        <Route path="painting/quotes" element={<QuotationPage />} />
        <Route path="painting/progress" element={<ProgressTrackingPage />} />
        <Route path="painting/inspection" element={<InspectionPage />} />
      </Route>
    </Routes>
  );
}