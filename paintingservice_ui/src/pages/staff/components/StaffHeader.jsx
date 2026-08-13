// staff/components/StaffHeader.jsx
const StaffHeader = () => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-10">
      <h2 className="text-xl font-semibold text-slate-800">Cổng Nhân Viên</h2>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-blue-600 transition">
          🔔
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-700">Nguyễn Văn A</p>
            <p className="text-xs text-slate-500">Đang hoạt động</p>
          </div>
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="Avatar" 
            className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200"
          />
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;