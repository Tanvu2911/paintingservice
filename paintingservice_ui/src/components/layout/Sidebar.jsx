export default function Sidebar({
  logoIcon = "S",
  logoTextPrimary = "Quản Trị",
  logoTextSecondary = "247",
  color = "blue",
  activeTab,
  onTabChange,
  onLogout,
  menuItems = [],
}) {
  const colorMap = {
    blue: {
      bg: "bg-blue-600",
      hover: "hover:bg-blue-50",
      active: "bg-blue-50 text-blue-700 border-r-4 border-blue-600",
      logoBg: "bg-blue-600",
    },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col min-h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${c.logoBg} rounded-xl flex items-center justify-center text-white font-black text-lg`}>
            {logoIcon}
          </div>
          <div>
            <p className="font-black text-slate-800 leading-tight">{logoTextPrimary}</p>
            <p className="text-xs text-slate-400 font-medium">{logoTextSecondary}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.value
                ? c.active
                : `text-slate-600 ${c.hover}`
              }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
        >
          <span>🚪</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}