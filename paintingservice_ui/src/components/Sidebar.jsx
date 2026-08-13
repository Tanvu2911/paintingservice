import { useNavigate } from 'react-router-dom';

const Sidebar = ({ 
  logoIcon = "S", 
  logoTextPrimary = "Hệ Thống", 
  logoTextSecondary = "247",
  menuItems = [], 
  activeTab, 
  onTabChange, 
  onLogout,
  color = "blue" // "blue" | "amber"
}) => {
  const navigate = useNavigate();

  // Cấu hình theme dựa trên prop color
  const theme = {
    blue: {
      active: 'bg-blue-600 text-white shadow-xl shadow-blue-600/40 scale-[1.02]',
      logo: 'bg-blue-600',
      span: 'text-blue-500',
      homeHover: 'hover:bg-blue-600'
    },
    amber: {
      active: 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-xl shadow-orange-500/30 scale-[1.02]',
      logo: 'bg-amber-500 text-slate-900',
      span: 'text-amber-500',
      homeHover: 'hover:bg-amber-500'
    }
  }[color] || {
    active: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30',
    logo: 'bg-blue-600',
    span: 'text-blue-500',
    homeHover: 'hover:bg-blue-600'
  };

  return (
    <aside className="w-72 bg-[#0f172a] text-white p-6 flex flex-col justify-between shadow-2xl sticky top-0 h-screen shrink-0 overflow-y-auto border-r border-slate-800/50">
      <div>
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-800">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${theme.logo}`}>
            {logoIcon}
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            {logoTextPrimary} <span className={theme.span}>{logoTextSecondary}</span>
          </h2>
        </div>
        
        {/* Navigation Menu */}
        <p className="text-[10px] text-slate-500 tracking-[0.2em] font-black mb-4 px-2 uppercase">Menu điều hướng</p>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.value}
              className={`w-full px-4 py-3 text-left rounded-2xl text-sm font-bold transition-all duration-300 flex items-center gap-3 relative group ${
                activeTab === item.value ? theme.active : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => onTabChange(item.value)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg shadow-rose-900/40 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-800 space-y-2">
        <button onClick={() => navigate('/home')} className={`w-full py-3 bg-slate-800 ${theme.homeHover} text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm group`}>
          <span className="group-hover:-translate-x-1 transition-transform">🏠</span> Về Trang Chủ
        </button>
        <button onClick={onLogout} className="w-full py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm">
          <span>🚪</span> Đăng Xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;