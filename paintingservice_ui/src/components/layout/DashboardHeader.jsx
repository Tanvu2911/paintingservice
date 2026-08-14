export default function DashboardHeader({
  title,
  subtitle,
  userName = "Admin",
  userRole = "Quản trị viên",
  avatarChar = "A",
  color = "blue",
  variant = "dark",
  onLogout,
}) {
  const isDark = variant === "dark";
  const avatarBg =
    {
      blue: "bg-blue-600",
      emerald: "bg-emerald-600",
      purple: "bg-purple-600",
      amber: "bg-amber-500",
    }[color] || "bg-blue-600";

  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className={`text-2xl font-black ${isDark ? "text-slate-100" : "text-slate-800"}`}>
          {title}
        </h1>
        <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className={`font-bold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              {userName}
            </p>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {userRole}
            </p>
          </div>
          <div
            className={`w-11 h-11 rounded-full ${avatarBg} text-white flex items-center justify-center font-black text-lg shadow-lg`}
          >
            {avatarChar}
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
              isDark
                ? "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                : "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 shadow-sm"
            }`}
            title="Đăng xuất"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        )}
      </div>
    </div>
  );
}
