// staff/components/StaffSidebar.jsx
import { Link, useLocation } from 'react-router-dom';

const StaffSidebar = () => {
  const location = useLocation();
  // Giả sử URL có dạng /staff/survey/... hoặc /staff/technician/...
  const isSurvey = location.pathname.includes('/survey');
  const basePath = isSurvey ? '/staff/survey' : '/staff/technician';
  const roleName = isSurvey ? 'Khảo sát viên' : 'Thợ thi công';

  const menuItems = [
    { name: 'Tổng quan', path: `${basePath}/dashboard`, icon: '📊' },
    { name: 'Công việc', path: `${basePath}/jobs`, icon: '📋' },
    { name: 'Lịch sử', path: `${basePath}/history`, icon: '🕒' },
    { name: 'Ví / Thu nhập', path: `${basePath}/wallet`, icon: '💰' },
    { name: 'Thống kê', path: `${basePath}/statistics`, icon: '📈' },
    { name: 'Tài khoản', path: `${basePath}/profile`, icon: '👤' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">
          S
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">PaintService</h1>
          <p className="text-xs text-blue-300">{roleName}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700">
        <button className="w-full py-2.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default StaffSidebar;