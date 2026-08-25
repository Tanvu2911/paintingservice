import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  FileText,
  CreditCard,
  Paintbrush,
  ShieldCheck,
  Star,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import Sidebar from "../../components/layout/Sidebar";
import NotificationPopover from "../../components/layout/NotificationPopover";
import UserMenuDropdown from "../../components/layout/UserMenuDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function AdminLayout({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(user);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/employees")) return "employees";
    if (path.includes("/accounts")) return "accounts";
    if (path.includes("/customers")) return "customers";
    if (path.includes("/bookings") || path.includes("/orders")) return "bookings";
    if (path.includes("/contracts")) return "contracts";
    if (path.includes("/payments") || path.includes("/wallet") || path.includes("/revenue")) return "payments";
    if (path.includes("/services") || path.includes("/painting")) return "services";
    if (path.includes("/reviews")) return "reviews";
    if (path.includes("/notifications")) return "notifications";
    return "dashboard";
  };

  useEffect(() => {
    const fetchNoti = async () => {
      try {
        const [notiRes, meRes] = await Promise.all([
          AxiosConfig.get("/notifications/me"),
          AxiosConfig.get("/users/me"),
        ]);
        setNotifications(notiRes.data || []);
        setProfile(meRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNoti();
  }, [location.pathname]);

  const handleMarkRead = async () => {
    if (notifications.some((n) => !n.isRead)) {
      try {
        await AxiosConfig.put("/notifications/me/read");
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Xóa tất cả thông báo?")) return;
    try {
      await AxiosConfig.delete("/notifications/me");
      setNotifications([]);
      showToast?.("Đã xóa tất cả thông báo", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOne = async (id) => {
    try {
      await AxiosConfig.delete(`/notifications/me/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast?.("Đã xóa thông báo", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    onLogout();
    showToast?.("Đăng xuất thành công!", "success");
    navigate("/login");
  };

  const adminMenuItems = [
    { label: "Tổng quan", icon: <LayoutDashboard className="w-4 h-4" />, value: "dashboard" },
    { label: "Quản Lý Nhân Viên", icon: <Users className="w-4 h-4" />, value: "employees" },
    { label: "Quản Lý Khách Hàng", icon: <UserCheck className="w-4 h-4" />, value: "customers" },
    { label: "Quản Lý Yêu Cầu", icon: <ClipboardList className="w-4 h-4" />, value: "bookings" },
    { label: "Hợp Đồng", icon: <FileText className="w-4 h-4" />, value: "contracts" },
    { label: "Quản Lý Thanh Toán", icon: <CreditCard className="w-4 h-4" />, value: "payments" },
    { label: "Quản Lý Dịch Vụ", icon: <Paintbrush className="w-4 h-4" />, value: "services" },
    { label: "Quản Lý Đánh Giá", icon: <Star className="w-4 h-4" />, value: "reviews" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar
        logoIcon={<ShieldCheck className="w-5 h-5 text-white" />}
        logoTextPrimary="Quản Trị"
        logoTextSecondary="Sơn Sửa 247"
        color="blue"
        activeTab={getActiveTab()}
        onTabChange={(tab) => navigate(`/admin/${tab === "dashboard" ? "" : tab}`)}
        onLogout={handleLogoutRequest}
        menuItems={adminMenuItems}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Trung Tâm Quản Trị Hệ Thống Sơn Sửa 247
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPopover
              user={profile || user}
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onDeleteAll={handleDeleteAll}
              onDeleteOne={handleDeleteOne}
              color="blue"
            />
            <div className="h-6 w-px bg-slate-200"></div>
            <UserMenuDropdown
              profile={profile || user}
              role="admin"
              color="blue"
              onLogout={handleLogoutRequest}
              menuItems={[
                { label: "Tổng quan", to: "/admin/", icon: <LayoutDashboard /> },
                { label: "Quản lý nhân viên", to: "/admin/employees", icon: <Users /> },
                { label: "Quản lý khách hàng", to: "/admin/customers", icon: <UserCheck /> },
                { label: "Quản lý yêu cầu", to: "/admin/bookings", icon: <ClipboardList /> },
                { label: "Thanh toán", to: "/admin/payments", icon: <CreditCard /> },
                { label: "Quản lý dịch vụ", to: "/admin/services", icon: <Paintbrush /> },
                { label: "Quản lý đánh giá", to: "/admin/reviews", icon: <Star /> },
              ]}
            />
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet context={{ user: profile, showToast, setNotifications }} />
        </main>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi hệ thống?"
        confirmColor="bg-emerald-600 hover:bg-emerald-700"
      />
    </div>
  );
}