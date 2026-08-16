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
    if (path.includes("/accounts")) return "accounts";
    if (path.includes("/customers")) return "customers";
    if (path.includes("/bookings") || path.includes("/orders")) return "bookings";
    if (path.includes("/contracts")) return "contracts";
    if (path.includes("/payments")) return "payments";
    if (path.includes("/services") || path.includes("/painting")) return "services";
    if (path.includes("/revenue")) return "revenue";
    if (path.includes("/wallet")) return "wallet";
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
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar
        logoIcon="👑"
        logoTextPrimary="Quản Trị"
        logoTextSecondary="Sơn Sửa 247"
        color="blue"
        activeTab={getActiveTab()}
        onTabChange={(tab) => navigate(`/admin/${tab === "dashboard" ? "" : tab}`)}
        onLogout={handleLogout}
        menuItems={[
          { label: "Tổng quan", icon: "📊", value: "dashboard" },
          { label: "Quản Lý Nhân Viên", icon: "🧰", value: "employees" },
          { label: "Quản Lý Khách Hàng", icon: "👥", value: "customers" },
          { label: "Quản Lý Yêu Cầu", icon: "📋", value: "bookings" },
          { label: "Hợp Đồng", icon: "📄", value: "contracts" },
          { label: "Thanh Toán NV", icon: "💰", value: "payments" },
          { label: "Quản Lý Dịch Vụ", icon: "🎨", value: "services" },
        ]}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Trung Tâm Quản Trị Hệ Thống Sơn Sửa 247
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPopover
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onDeleteAll={handleDeleteAll}
              onDeleteOne={handleDeleteOne}
              color="blue"
            />
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white bg-blue-600 shadow-sm shadow-blue-500/20">
                {(profile?.fullName || profile?.username || "A").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {profile?.fullName || profile?.username || "Quản trị viên"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet context={{ user: profile, showToast, setNotifications }} />
        </main>
      </div>
    </div>
  );
}