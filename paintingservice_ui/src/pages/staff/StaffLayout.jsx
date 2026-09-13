import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  History,
  Wallet,
  User,
  BarChart3,
  ClipboardList,
  Wrench,
  Search,
  Star,
  ShieldAlert,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import Sidebar from "../../components/layout/Sidebar";
import NotificationPopover from "../../components/layout/NotificationPopover";
import UserMenuDropdown from "../../components/layout/UserMenuDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function StaffLayout({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(user);

  // 1. Phân biệt loại Staff (Technician/Worker vs Survey/Supervisor) theo URL
  const isTechnician = location.pathname.includes("/staff/technician");
  const basePath = isTechnician ? "/staff/technician" : "/staff/survey";

  // 2. Xác định Active Tab dựa trên đường dẫn hiện tại
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/jobs")) return "jobs";
    if (path.includes("/warranties")) return "warranties";
    if (path.includes("/history")) return "history";
    if (path.includes("/wallet")) return "wallet";
    if (path.includes("/statistics")) return "statistics";
    if (path.includes("/reviews")) return "reviews";
    if (path.includes("/profile")) return "profile";
    return "dashboard";
  };

  // 3. Fetch dữ liệu thông báo và Profile người dùng
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notiRes, meRes] = await Promise.all([
          AxiosConfig.get("/notifications/me"),
          AxiosConfig.get("/users/me"),
        ]);
        setNotifications(notiRes.data || []);
        setProfile(meRes.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu Staff:", err);
      }
    };
    fetchData();
  }, [location.pathname]);

  // 4. Các hàm xử lý Thông báo
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

  const handleMarkSingleRead = async (id) => {
    try {
      await AxiosConfig.put(`/notifications/me/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
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

  // 5. Xử lý Đăng xuất
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    onLogout();
    showToast?.("Đăng xuất thành công!", "success");
    navigate("/login");
  };

  // 6. Cấu hình Menu linh hoạt theo vai trò bằng SVG Lucide Icons
  const surveyMenuItems = [
    { label: "Tổng quan", icon: <LayoutDashboard className="w-4 h-4" />, value: "dashboard" },
    { label: "Lịch Khảo Sát", icon: <ClipboardList className="w-4 h-4" />, value: "jobs" },
    { label: "Bảo Hành", icon: <ShieldAlert className="w-4 h-4" />, value: "warranties" },
    { label: "Lịch Sử Khảo Sát", icon: <History className="w-4 h-4" />, value: "history" },
    { label: "Ví Thu Nhập", icon: <Wallet className="w-4 h-4" />, value: "wallet" },
    { label: "Thống Kê", icon: <BarChart3 className="w-4 h-4" />, value: "statistics" },
    { label: "Đánh Giá Của Khách", icon: <Star className="w-4 h-4" />, value: "reviews" },
    { label: "Trang Cá Nhân", icon: <User className="w-4 h-4" />, value: "profile" },
  ];

  const technicianMenuItems = [
    { label: "Tổng quan", icon: <LayoutDashboard className="w-4 h-4" />, value: "dashboard" },
    { label: "Công Việc Thi Công", icon: <Briefcase className="w-4 h-4" />, value: "jobs" },
    { label: "Bảo Hành", icon: <ShieldAlert className="w-4 h-4" />, value: "warranties" },
    { label: "Lịch Sử Thi Công", icon: <History className="w-4 h-4" />, value: "history" },
    { label: "Ví Thu Nhập", icon: <Wallet className="w-4 h-4" />, value: "wallet" },
    { label: "Thống Kê", icon: <BarChart3 className="w-4 h-4" />, value: "statistics" },
    { label: "Đánh Giá Của Khách", icon: <Star className="w-4 h-4" />, value: "reviews" },
    { label: "Trang Cá Nhân", icon: <User className="w-4 h-4" />, value: "profile" },
  ];

  const currentMenuItems = isTechnician ? technicianMenuItems : surveyMenuItems;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar
        logoIcon={
          isTechnician ? (
            <Wrench className="w-5 h-5 text-white" />
          ) : (
            <Search className="w-5 h-5 text-white" />
          )
        }
        logoTextPrimary={isTechnician ? "Kỹ Thuật" : "Khảo Sát"}
        logoTextSecondary="Sơn Sửa 247"
        color={isTechnician ? "amber" : "blue"}
        activeTab={getActiveTab()}
        onTabChange={(tab) =>
          navigate(`${basePath}/${tab === "dashboard" ? "dashboard" : tab}`)
        }
        onLogout={handleLogoutRequest}
        menuItems={currentMenuItems}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isTechnician ? "bg-amber-600" : "bg-blue-600"
                }`}
            ></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTechnician ? "Hệ Thống Đội Thợ Thi Công" : "Hệ Thống Giám Sát Khảo Sát"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPopover
              user={profile || user}
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkRead}
              onMarkSingleRead={handleMarkSingleRead}
              onDeleteAll={handleDeleteAll}
              onDeleteOne={handleDeleteOne}
              color={isTechnician ? "amber" : "blue"}
            />
            <div className="h-6 w-px bg-slate-200"></div>
            <UserMenuDropdown
              profile={profile || user}
              role={isTechnician ? "technician" : "survey"}
              color={isTechnician ? "amber" : "blue"}
              onLogout={handleLogoutRequest}
              menuItems={[
                { label: "Tổng quan", to: `${basePath}/dashboard`, icon: <LayoutDashboard /> },
                { label: isTechnician ? "Công việc thi công" : "Lịch khảo sát", to: `${basePath}/jobs`, icon: <Briefcase /> },
                { label: "Bảo hành", to: `${basePath}/warranties`, icon: <ShieldAlert /> },
                { label: "Lịch sử", to: `${basePath}/history`, icon: <History /> },
                { label: "Ví thu nhập", to: `${basePath}/wallet`, icon: <Wallet /> },
                { label: "Đánh giá của khách", to: `${basePath}/reviews`, icon: <Star /> },
                { label: "Trang cá nhân", to: `${basePath}/profile`, icon: <User /> },
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