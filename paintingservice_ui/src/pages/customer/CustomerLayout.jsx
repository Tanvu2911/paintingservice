import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import AxiosConfig from "../../util/AxiosConfig";
import NotificationPopover from "../../components/layout/NotificationPopover";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const menuItems = [
  { label: "Tổng quan", icon: "🏠", path: "/customer/dashboard" },
  { label: "Đặt lịch", icon: "📋", path: "/customer/booking" },
  { label: "Lịch sử", icon: "📜", path: "/customer/history" },
  { label: "Ví thanh toán", icon: "💰", path: "/customer/wallet" },
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/home" className="font-black text-slate-800 text-lg">
            Xây Dựng <span className="text-blue-600">247</span>
          </Link>
          <nav className="hidden md:flex gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition ${
                  location.pathname === item.path
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationPopover
              notifications={notifications}
              onMarkRead={async () => {
                await AxiosConfig.put("/notifications/me/read");
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
            <button
              type="button"
              onClick={() => setShowLogout(true)}
              className="text-sm text-rose-600 font-semibold hover:bg-rose-50 px-3 py-2 rounded-lg"
            >
              Đăng xuất
            </button>
          </div>
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
