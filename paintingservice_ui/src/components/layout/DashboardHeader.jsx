import { LogOut } from "lucide-react";

export default function DashboardHeader({
  title,
  subtitle,
  userName = "Admin",
  userRole = "Quản trị viên",
  avatarChar = "A",
  color = "blue",
  onLogout,
}) {
  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">
          {title}
        </h1>
        <p className="text-sm mt-1 text-slate-500">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-sm text-slate-800">
              {userName}
            </p>
            <p className="text-xs text-slate-400">
              {userRole}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
            {avatarChar}
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        )}
      </div>
    </div>
  );
}
