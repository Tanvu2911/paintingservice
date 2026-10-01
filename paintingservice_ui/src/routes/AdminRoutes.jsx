import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout";
import PageLoadingFallback from "../components/common/PageLoadingFallback";

const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const EmployeeManagement = lazy(() => import("../pages/admin/employees/EmployeeManagement"));
const CustomerManagement = lazy(() => import("../pages/admin/customers/CustomerManagement"));
const OrderList = lazy(() => import("../pages/admin/orders/OrderList"));
const OrderDetail = lazy(() => import("../pages/admin/orders/OrderDetail"));
const ContractManagement = lazy(() => import("../pages/admin/contracts/ContractManagement"));
const PaymentToStaff = lazy(() => import("../pages/admin/payments/PaymentToStaff"));
const ServiceManagement = lazy(() => import("../pages/admin/services/ServiceManagement"));
const AccountManagement = lazy(() => import("../pages/admin/accounts/AccountManagement"));
const ReviewManagement = lazy(() => import("../pages/admin/reviews/ReviewManagement"));
const WarrantyManagement = lazy(() => import("../pages/admin/warranties/WarrantyManagement"));
const WarrantyDetail = lazy(() => import("../pages/admin/warranties/WarrantyDetail"));

export default function AdminRoutes({ user, onLogout, showToast }) {
  return (
    <Suspense fallback={<PageLoadingFallback message="Đang tải trang quản trị..." />}>
      <Routes>
        <Route
          element={<AdminLayout user={user} onLogout={onLogout} showToast={showToast} />}
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="bookings" element={<OrderList />} />
          <Route path="bookings/:id" element={<OrderDetail />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="contracts" element={<ContractManagement />} />
          <Route path="payments" element={<PaymentToStaff />} />
          <Route path="revenue" element={<Navigate to="/admin/payments" replace />} />
          <Route path="wallet" element={<Navigate to="/admin/payments" replace />} />
          <Route path="warranties" element={<WarrantyManagement />} />
          <Route path="warranties/:id" element={<WarrantyDetail />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="reviews" element={<ReviewManagement />} />
        </Route>
      </Routes>
    </Suspense>
  );
}