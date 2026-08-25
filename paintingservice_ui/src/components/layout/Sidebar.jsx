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
      logoBg: "bg-emerald-600",
      active: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold",
      hover: "hover:bg-emerald-50 hover:text-emerald-800",
      dot: "bg-emerald-600",
    },
    amber: {
      logoBg: "bg-emerald-600",
      active: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold",
      hover: "hover:bg-emerald-50 hover:text-emerald-800",
      dot: "bg-emerald-600",
    },
    emerald: {
      logoBg: "bg-emerald-600",
      active: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold",
      hover: "hover:bg-emerald-50 hover:text-emerald-800",
      dot: "bg-emerald-600",
    },
  };
  const accent = accentMap[color] || accentMap.emerald;

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
