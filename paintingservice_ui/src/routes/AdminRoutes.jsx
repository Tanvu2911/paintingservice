import { Routes, Route } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import EmployeeManagement from "../pages/admin/employees/EmployeeManagement";
import CustomerManagement from "../pages/admin/customers/CustomerManagement";
import OrderList from "../pages/admin/orders/OrderList";
import OrderDetail from "../pages/admin/orders/OrderDetail";
import ContractManagement from "../pages/admin/contracts/ContractManagement";
import PaymentToStaff from "../pages/admin/payments/PaymentToStaff";
import ServiceManagement from "../pages/admin/services/ServiceManagement";
import AccountManagement from "../pages/admin/accounts/AccountManagement";
import { Navigate } from "react-router-dom";

export default function AdminRoutes({ user, onLogout, showToast }) {
  return (
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
        <Route path="services" element={<ServiceManagement />} />
        <Route path="painting" element={<ServiceManagement />} />
      </Route>
    </Routes>
  );
}