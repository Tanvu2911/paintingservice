import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import Sidebar from "../../components/layout/Sidebar";
import NotificationPopover from "../../components/layout/NotificationPopover";

export default function AdminLayout({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(user);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/employees")) return "employees";
    if (path.includes("/customers")) return "customers";
    if (path.includes("/bookings")) return "bookings";
    if (path.includes("/contracts")) return "contracts";
    if (path.includes("/accounts")) return "accounts";
    if (path.includes("/revenue")) return "revenue";
    if (path.includes("/wallet")) return "wallet";
    if (path.includes("/painting")) return "painting";
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
      showToast?.("Đã xóa tất cả thông báo");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOne = async (id) => {
    try {
      await AxiosConfig.delete(`/notifications/me/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      onLogout();
      showToast?.("Đăng xuất thành công!");
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
      <Sidebar
        logoIcon="S"
        logoTextPrimary="Quản Trị"
        logoTextSecondary="247"
        color="blue"
        theme="dark"
        activeTab={getActiveTab()}
        onTabChange={(tab) => {
          const pathMap = {
            dashboard: "/admin/dashboard",
            accounts: "/admin/accounts",
            employees: "/admin/employees",
            customers: "/admin/customers",
            bookings: "/admin/bookings",
            contracts: "/admin/contracts",
            revenue: "/admin/revenue",
            wallet: "/admin/wallet",
            payments: "/admin/payments",
            painting: "/admin/painting",
          };
          navigate(pathMap[tab] || "/admin/dashboard");
        }}
        onLogout={handleLogout}
        menuItems={[
          { label: "Tổng quan", icon: "📊", value: "dashboard" },
          { label: "Quản lý tài khoản", icon: "🔐", value: "accounts" },
          { label: "Quản Lý Nhân Viên", icon: "🧰", value: "employees" },
          { label: "Quản Lý Khách Hàng", icon: "👥", value: "customers" },
          { label: "Quản Lý Yêu Cầu", icon: "📋", value: "bookings" },
          { label: "Hợp Đồng", icon: "📄", value: "contracts" },
          { label: "Doanh thu", icon: "📈", value: "revenue" },
          { label: "Ví hệ thống", icon: "🏦", value: "wallet" },
          { label: "Thanh Toán NV", icon: "💰", value: "payments" },
          { label: "Dịch Vụ Sơn Nhà", icon: "🎨", value: "painting" },
        ]}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4 pb-0">
          <NotificationPopover
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onDeleteAll={handleDeleteAll}
            onDeleteOne={handleDeleteOne}
            theme="dark"
          />
        </div>

        <div className="flex-1 p-8 pt-4 overflow-y-auto">
          <Outlet context={{ user: profile, showToast, setNotifications }} />
        </div>
      </div>
    </div>
  );
}