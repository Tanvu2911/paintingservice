export default function DashboardHeader({
  title,
  subtitle,
  userName = "Admin",
  userRole = "Quản trị viên",
  avatarChar = "A",
  color = "blue",
  onLogout, // 🛠️ Thêm prop onLogout ở đây
}) {
  const avatarBg =
    {
      blue: "bg-blue-600",
      emerald: "bg-emerald-600",
      purple: "bg-purple-600",
    }[color] || "bg-blue-600";

  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">{title}</h1>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Thông tin User & Avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-slate-800 text-sm">{userName}</p>
            <p className="text-xs text-slate-400">{userRole}</p>
          </div>
          <div
            className={`w-11 h-11 rounded-full ${avatarBg} text-white flex items-center justify-center font-black text-lg shadow-sm`}
          >
            {avatarChar}
          </div>
        </div>

        {/* 🚪 Nút Đăng xuất (Tự động hiển thị khi trang gọi component này có truyền prop onLogout) */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition shadow-sm cursor-pointer"
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