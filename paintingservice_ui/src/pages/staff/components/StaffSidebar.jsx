import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  History,
  Wallet,
  BarChart3,
  User,
  LogOut,
  Paintbrush,
  ShieldAlert,
} from 'lucide-react';

const StaffSidebar = ({ onLogout }) => {
  const location = useLocation();
  const isSurvey = location.pathname.includes('/survey');
  const basePath = isSurvey ? '/staff/survey' : '/staff/technician';
  const roleName = isSurvey ? 'Khảo sát viên' : 'Thợ thi công';

  const menuItems = [
    { name: 'Tổng quan', path: `${basePath}/dashboard`, icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Công việc', path: `${basePath}/jobs`, icon: <ClipboardList className="w-4 h-4" /> },
    { name: 'Bảo hành', path: `${basePath}/warranties`, icon: <ShieldAlert className="w-4 h-4" /> },
    { name: 'Lịch sử', path: `${basePath}/history`, icon: <History className="w-4 h-4" /> },
    { name: 'Ví / Thu nhập', path: `${basePath}/wallet`, icon: <Wallet className="w-4 h-4" /> },
    { name: 'Thống kê', path: `${basePath}/statistics`, icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Tài khoản', path: `${basePath}/profile`, icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="w-64 bg-[#0F172A] text-white flex flex-col h-full shadow-xl">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1E3A8A] border border-blue-700/60 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-xs">
          <Paintbrush className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-black text-base leading-tight tracking-wide">
            Painting<span className="text-blue-400">247</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">{roleName}</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          const activeBg = isSurvey ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold' : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold';
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive ? activeBg : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full py-2 px-3.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2.5 cursor-pointer text-left"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default StaffSidebar;