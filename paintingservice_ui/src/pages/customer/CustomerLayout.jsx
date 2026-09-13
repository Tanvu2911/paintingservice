import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Paintbrush,
  LayoutDashboard,
  CalendarPlus,
  ClipboardList,
  Wallet,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import NotificationPopover from "../../components/layout/NotificationPopover";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const menuItems = [
  { label: "Tổng quan", Icon: LayoutDashboard, path: "/customer/dashboard" },
  { label: "Đặt lịch khảo sát", Icon: CalendarPlus, path: "/customer/booking" },
  { label: "Quản lý công trình", Icon: ClipboardList, path: "/customer/ongoing" },
  { label: "Ví & Thanh toán", Icon: Wallet, path: "/customer/wallet" },
  { label: "Tài khoản", Icon: User, path: "/customer/profile" },
];

export default function CustomerLayout({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState(user);
  const [showLogout, setShowLogout] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    onLogout();
    showToast?.("Đăng xuất thành công!", "success");
    navigate("/home");
  };

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Main Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo - Precision Paint Navy */}
          <Link
            to="/home"
            className="flex items-center gap-3 group shrink-0"
            title="Về trang chủ Precision Paint"
          >
            <div className="w-10 h-10 bg-[#1E3A8A] text-white rounded-2xl flex items-center justify-center shadow-md shadow-[#1E3A8A]/20 group-hover:bg-[#1e40af] transition-transform group-hover:scale-105">
              <Paintbrush className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 leading-none">
                PAINTING<span className="text-[#1E3A8A]">247</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Cổng Dịch Vụ Khách Hàng
              </p>
            </div>
          </Link>

          {/* Navigation Menu (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
            {menuItems.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== "/customer/dashboard" && location.pathname.startsWith(item.path + "/"));
              const IconComp = item.Icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    active
                      ? "bg-[#1E3A8A] text-white shadow-sm shadow-[#1E3A8A]/30"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <NotificationPopover
              user={profile || user}
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkRead}
              onMarkSingleRead={handleMarkSingleRead}
              onDeleteAll={handleDeleteAll}
              onDeleteOne={handleDeleteOne}
            />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-black text-xs">
                  {profile?.fullName
                    ? profile.fullName[0].toUpperCase()
                    : profile?.username
                      ? profile.username[0].toUpperCase()
                      : "K"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[120px] leading-tight">
                    {profile?.fullName || profile?.username || "Khách hàng"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    Tài khoản cá nhân
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-1.5 animate-in fade-in duration-150">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {profile?.fullName || profile?.username}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                      {profile?.email || "Khách hàng thân thiết"}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/customer/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E3A8A] transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Thông tin tài khoản</span>
                    </Link>
                    <Link
                      to="/customer/booking"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E3A8A] transition"
                    >
                      <CalendarPlus className="w-4 h-4 text-slate-400" />
                      <span>Đăng ký khảo sát</span>
                    </Link>
                    <Link
                      to="/customer/ongoing"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E3A8A] transition"
                    >
                      <ClipboardList className="w-4 h-4 text-slate-400" />
                      <span>Quản lý công trình</span>
                    </Link>
                    <Link
                      to="/customer/wallet"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E3A8A] transition"
                    >
                      <Wallet className="w-4 h-4 text-slate-400" />
                      <span>Ví &amp; Lịch sử thanh toán</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowLogout(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="lg:hidden border-t border-slate-100 px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/60">
          {menuItems.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== "/customer/dashboard" && location.pathname.startsWith(item.path + "/"));
            const IconComp = item.Icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  active
                    ? "bg-[#1E3A8A] text-white shadow-xs"
                    : "text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-100"
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${active ? "text-amber-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet context={{ user: profile, showToast, setNotifications }} />
      </main>

      <ConfirmDialog
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title="Đăng xuất tài khoản"
        message="Bạn có chắc muốn đăng xuất khỏi hệ thống Precision Paint?"
        confirmColor="bg-[#1E3A8A] hover:bg-[#1e40af]"
      />
    </div>
  );
}