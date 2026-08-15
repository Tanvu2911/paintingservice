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

  const accentMap = {
    blue: {
      logoBg: "bg-blue-600",
    },
  };
  const accent = accentMap[color] || accentMap.blue;

  return (
    <aside
      className={`w-64 flex flex-col min-h-screen sticky top-0 ${
        "bg-white border-r border-slate-200"
      }`}
    >
      <div className={`p-5 border-b ${ "border-slate-100"}`}>
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${accent.logoBg} rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg`}
          >
            {logoIcon}
          </div>
          <div>
            <p className={`font-black leading-tight ${"text-slate-800"}`}>
              {logoTextPrimary}
            </p>
            <p className={`text-xs font-medium ${ "text-slate-400"}`}>
              {logoTextSecondary}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === item.value
                ? accent.active
                
                : `text-slate-600 ${accent.hover}`
            }`}
          >
            <span className="text-base shrink-0">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span
                className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  activeTab === item.value
                    ? "bg-white/20 text-inherit"
                    : `${accent.dot} text-white`
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className={`p-3 border-t ${ "border-slate-100"}`}>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
             "text-rose-600 hover:bg-rose-50"
          }`}
        >
          <span>🚪</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
