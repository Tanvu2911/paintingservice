import { LogOut } from "lucide-react";

export default function Sidebar({
  logoIcon,
  logoTextPrimary = "Quản Trị",
  logoTextSecondary = "247",
  color = "blue",
  activeTab,
  onTabChange,
  onLogout,
  menuItems = [],
}) {
  const accentMap = {
    blue: {
      logoBg: "bg-[#1E3A8A]",
      active: "bg-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/20 font-bold",
      hover: "hover:bg-blue-50 hover:text-[#1E3A8A]",
      dot: "bg-amber-500",
    },
    amber: {
      logoBg: "bg-[#1E3A8A]",
      active: "bg-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/20 font-bold",
      hover: "hover:bg-blue-50 hover:text-[#1E3A8A]",
      dot: "bg-amber-500",
    },
    emerald: {
      logoBg: "bg-[#1E3A8A]",
      active: "bg-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/20 font-bold",
      hover: "hover:bg-blue-50 hover:text-[#1E3A8A]",
      dot: "bg-amber-500",
    },
  };
  const accent = accentMap[color] || accentMap.blue;

  return (
    <aside className="w-64 flex flex-col min-h-screen sticky top-0 bg-white border-r border-slate-200 shadow-xs z-20">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${accent.logoBg} rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm`}
          >
            {logoIcon || "P"}
          </div>
          <div>
            <p className="font-black leading-tight text-slate-800 text-sm">
              {logoTextPrimary}
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              {logoTextSecondary}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isActive
                  ? accent.active
                  : `text-slate-600 ${accent.hover}`
                }`}
            >
              <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-500"}`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {/* Hình tròn nháy thông báo trên các mục */}
              {item.hasPing && (
                <span className="relative flex h-2.5 w-2.5 shrink-0" title="Có thông báo / cập nhật mới">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      isActive ? "bg-amber-300" : "bg-blue-400"
                    } opacity-75`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isActive ? "bg-amber-400" : "bg-blue-600"
                    }`}
                  />
                </span>
              )}
              {item.badge != null && item.badge > 0 && (
                <span
                  className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${isActive
                      ? "bg-white/20 text-inherit"
                      : `${accent.dot} text-white`
                    }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
