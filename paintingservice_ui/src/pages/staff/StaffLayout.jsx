import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import Sidebar from "../../components/layout/Sidebar";
import NotificationPopover from "../../components/layout/NotificationPopover";

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
    if (path.includes("/history")) return "history";
    if (path.includes("/wallet")) return "wallet";
    if (path.includes("/statistics")) return "statistics";
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

  // 5. Xử lý Đăng xuất
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      onLogout();
      showToast?.("Đăng xuất thành công!");
      navigate("/login");
    }
  };

  // 6. Cấu hình Menu linh hoạt theo vai trò
  const surveyMenuItems = [
    { label: "Tổng quan", icon: "📊", value: "dashboard" },
    { label: "Lịch Khảo Sát", icon: "📋", value: "jobs" },
    { label: "Lịch Sử Khảo Sát", icon: "📜", value: "history" },
    { label: "Ví Thu Nhập", icon: "💰", value: "wallet" },
    { label: "Thống Kê", icon: "📈", value: "statistics" },
    { label: "Trang Cá Nhân", icon: "👤", value: "profile" },
  ];

  const technicianMenuItems = [
    { label: "Tổng quan", icon: "📊", value: "dashboard" },
    { label: "Công Việc Thi Công", icon: "🛠️", value: "jobs" },
    { label: "Lịch Sử Thi Công", icon: "📜", value: "history" },
    { label: "Ví Thu Nhập", icon: "💰", value: "wallet" },
    { label: "Thống Kê", icon: "📈", value: "statistics" },
    { label: "Trang Cá Nhân", icon: "👤", value: "profile" },
  ];

  const currentMenuItems = isTechnician ? technicianMenuItems : surveyMenuItems;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Sidebar
        logoIcon={isTechnician ? "🛠️" : "📋"}
        logoTextPrimary={isTechnician ? "Kỹ Thuật" : "Khảo Sát"}
        logoTextSecondary="Sơn Sửa 247"
        color={isTechnician ? "amber" : "blue"}
        activeTab={getActiveTab()}
        onTabChange={(tab) =>
          navigate(`${basePath}/${tab === "dashboard" ? "dashboard" : tab}`)
        }
        onLogout={handleLogout}
        menuItems={currentMenuItems}
      />

      {/* Area hiển thị Popover thông báo & Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isTechnician ? "bg-amber-500" : "bg-blue-600"}`}></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTechnician ? "Hệ Thống Đội Thợ Thi Công" : "Hệ Thống Giám Sát Khảo Sát"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationPopover
              user={profile || user}
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onDeleteAll={handleDeleteAll}
              onDeleteOne={handleDeleteOne}
              color={isTechnician ? "amber" : "blue"}
            />
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2.5 pl-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                isTechnician ? "bg-amber-600" : "bg-blue-600"
              }`}>
                {(profile?.fullName || profile?.username || "S").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {profile?.fullName || profile?.username || "Nhân viên"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isTechnician ? "Thợ thi công" : "Giám sát viên"}
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