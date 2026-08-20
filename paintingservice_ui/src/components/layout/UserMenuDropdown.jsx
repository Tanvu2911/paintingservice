import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";

/**
 * UserMenuDropdown — Component dùng chung cho Header của tất cả các Layout.
 *
 * Props:
 *  - profile       : object { fullName, username, email }
 *  - role          : "admin" | "survey" | "technician" | "customer"
 *  - onLogout      : () => void
 *  - menuItems     : [{ label, icon: ReactNode, to: string }]
 *  - color         : "blue" | "amber" | "emerald"  (mặc định "blue")
 */
export default function UserMenuDropdown({
  profile,
  role = "customer",
  onLogout,
  menuItems = [],
  color = "blue",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const roleLabel = {
    admin: "Administrator",
    survey: "Giám sát viên",
    technician: "Thợ thi công",
    customer: "Khách hàng",
  }[role] ?? role;

  const palette = {
    blue: {
      avatarBg: "bg-blue-50 text-blue-700",
      hover: "hover:bg-blue-50 hover:text-blue-700",
      iconColor: "text-blue-600",
    },
    amber: {
      avatarBg: "bg-amber-50 text-amber-700",
      hover: "hover:bg-amber-50 hover:text-amber-700",
      iconColor: "text-amber-600",
    },
    emerald: {
      avatarBg: "bg-emerald-50 text-emerald-700",
      hover: "hover:bg-emerald-50 hover:text-emerald-700",
      iconColor: "text-emerald-600",
    },
  }[color] ?? {
    avatarBg: "bg-blue-50 text-blue-700",
    hover: "hover:bg-blue-50 hover:text-blue-700",
    iconColor: "text-blue-600",
  };

  const displayName =
    profile?.fullName || profile?.username || "Tài khoản";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-xs"
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${palette.avatarBg}`}
        >
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-slate-800 max-w-[110px] truncate leading-tight">
            {displayName}
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
            {roleLabel}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 animate-in fade-in duration-150">
          {/* Header info */}
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900 truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {profile?.email || "Tài khoản hệ thống"}
            </p>
          </div>

          {/* Navigation links */}
          {menuItems.length > 0 && (
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 transition ${palette.hover}`}
                >
                  {item.icon && (
                    <span className={`w-4 h-4 shrink-0 ${palette.iconColor}`}>
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Logout */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
