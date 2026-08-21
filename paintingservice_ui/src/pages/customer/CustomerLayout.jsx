import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Paintbrush,
  LayoutDashboard,
  CalendarPlus,
  ClipboardList,
  History,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import NotificationPopover from "../../components/layout/NotificationPopover";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const menuItems = [
  { label: "Dashboard", Icon: LayoutDashboard, path: "/customer/dashboard" },
  { label: "Đặt lịch khảo sát", Icon: CalendarPlus, path: "/customer/booking" },
  { label: "Quản lý yêu cầu", Icon: ClipboardList, path: "/customer/ongoing" },
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/home"
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Paintbrush className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-black tracking-tight text-slate-900 leading-none">
                PAINTING<span className="text-emerald-600">247</span>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Dịch vụ sơn nhà chuyên nghiệp
              </p>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const active =
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/");
              const IconComp = item.Icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${active ? "text-white" : "text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info + Dropdown actions */}
          <div className="flex items-center gap-3 shrink-0">
            <NotificationPopover
              user={profile || user}
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
                showToast?.("Đã xóa tất cả thông báo", "success");
              }}
              onDeleteOne={async (id) => {
                await AxiosConfig.delete(`/notifications/me/${id}`);
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                showToast?.("Đã xóa thông báo", "info");
              }}
            />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                  {profile?.fullName
                    ? profile.fullName[0].toUpperCase()
                    : profile?.username
                    ? profile.username[0].toUpperCase()
                    : "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[110px] leading-tight">
                    {profile?.fullName || profile?.username || "Khách hàng"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                    Tài khoản cá nhân
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-1.5 animate-in fade-in duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {profile?.fullName || profile?.username}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {profile?.email || "Khách hàng"}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/customer/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Thông tin tài khoản</span>
                    </Link>
                    <Link
                      to="/customer/booking"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Đặt lịch khảo sát</span>
                    </Link>
                    <Link
                      to="/customer/ongoing"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                      <span>Quản lý yêu cầu</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setShowLogout(true);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto">
          {menuItems.map((item) => {
            const active =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
            const IconComp = item.Icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                  active
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${active ? "text-white" : "text-slate-500"}`} />
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
        message="Bạn có chắc muốn đăng xuất khỏi hệ thống?"
        confirmColor="bg-slate-900 hover:bg-slate-800"
      />
    </div>
  );
}