import { useNavigate } from "react-router-dom";
import { Paintbrush, CalendarPlus, ClipboardList, User } from "lucide-react";
import NotificationPopover from "../layout/NotificationPopover";
import UserMenuDropdown from "../layout/UserMenuDropdown";
import { isAdmin, isSurveyStaff, isTechnicianStaff, isCustomer, getRedirectPath } from "../../util/roleUtils";

export default function HomeNavbar({
  user,
  onLogout,
  notifications,
  onMarkRead,
  onDeleteAll,
  onDeleteOne,
  onBookingCTA,
}) {
  const navigate = useNavigate();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 px-4 sm:px-8 lg:px-12 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
            <Paintbrush className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
              PAINTING<span className="text-emerald-600">247</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Dịch vụ sơn nhà chuyên nghiệp
            </p>
          </div>
        </div>

        {/* Menu giữa */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <a href="#services" className="hover:text-emerald-600 transition">
            Dịch vụ
          </a>
          <a href="#workflow" className="hover:text-emerald-600 transition flex items-center gap-1.5">
            <span>Quy trình 24h</span>
          </a>
          <a href="#commitments" className="hover:text-emerald-600 transition">
            Cam kết
          </a>
          <a href="#testimonials" className="hover:text-emerald-600 transition">
            Đánh giá
          </a>
          <a href="#partners" className="hover:text-emerald-600 transition">
            Hãng sơn
          </a>
        </nav>

        {/* User Actions / Auth */}
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              {isCustomer(user) && (
                <button
                  type="button"
                  onClick={onBookingCTA}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <CalendarPlus className="w-4 h-4 text-white" />
                  <span>Đặt lịch khảo sát</span>
                </button>
              )}

              <NotificationPopover
                user={user}
                notifications={notifications}
                onMarkRead={onMarkRead}
                onDeleteAll={onDeleteAll}
                onDeleteOne={onDeleteOne}
              />

              <UserMenuDropdown
                profile={user}
                role={
                  isAdmin(user)
                    ? "admin"
                    : isSurveyStaff(user)
                    ? "survey"
                    : isTechnicianStaff(user)
                    ? "technician"
                    : "customer"
                }
                color="emerald"
                onLogout={onLogout}
                menuItems={
                  isCustomer(user)
                    ? [
                        { label: "Đặt lịch khảo sát", to: "/customer/booking", icon: <CalendarPlus /> },
                        { label: "Quản lý yêu cầu & Lịch sử", to: "/customer/ongoing", icon: <ClipboardList /> },
                        { label: "Hồ sơ & Địa chỉ", to: "/customer/profile", icon: <User /> },
                      ]
                    : [
                        { label: "Trang quản lý", to: getRedirectPath(user), icon: <User /> },
                      ]
                }
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
