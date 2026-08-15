import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import NotificationPopover from "../../components/layout/NotificationPopover";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const menuItems = [
  { label: "Tạo yêu cầu", icon: "➕", path: "/customer/booking" },
  { label: "Đang làm", icon: "🔄", path: "/customer/ongoing" },
  { label: "Lịch sử", icon: "📋", path: "/customer/history" },
  { label: "Tài khoản", icon: "👤", path: "/customer/profile" },
];

export default function CustomerLayout({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(user);
  const [showLogout, setShowLogout] = useState(false);

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
        console.error(err);
      }
    };
    if (user) fetchData();
  }, [user, location.pathname]);

  const handleLogout = () => {
    onLogout();
    showToast?.("Đăng xuất thành công!");
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/home"
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-slate-900 via-blue-900 to-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-md shadow-blue-900/20">
              🎨
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-black tracking-tight text-slate-900 leading-none">
                PAINTING<span className="text-blue-600">247</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Dịch vụ sơn nhà trọn gói
              </p>
            </div>
          </Link>

          {/* Menu 4 mục */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition ${active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                    }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info + actions (giống Home) */}
          <div className="flex items-center gap-3 shrink-0">
            <NotificationPopover
              notifications={notifications}
              onMarkRead={async () => {
                await AxiosConfig.put("/notifications/me/read");
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true }))
                );
              }}
              onDeleteAll={async () => {
                await AxiosConfig.delete("/notifications/me");
                setNotifications([]);
                showToast?.("Đã xóa tất cả thông báo");
              }}
              onDeleteOne={async (id) => {
                await AxiosConfig.delete(`/notifications/me/${id}`);
                setNotifications((prev) => prev.filter((n) => n.id !== id));
              }}
              color="blue"
            />

            <div className="hidden sm:block text-right">
              <div className="text-[11px] text-slate-400">Xin chào,</div>
              <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {profile?.fullName || profile?.username || profile?.email || "Khách hàng"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto">
          {menuItems.map((item) => {
            const active =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg whitespace-nowrap transition ${active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        <Outlet context={{ user: profile, showToast, setNotifications }} />
      </main>

      <ConfirmDialog
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất?"
        confirmColor="bg-rose-600 hover:bg-rose-700"
      />
    </div>
  );
}