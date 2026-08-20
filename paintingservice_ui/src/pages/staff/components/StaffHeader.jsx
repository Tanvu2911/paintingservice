import { Bell } from "lucide-react";

const StaffHeader = () => {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-10">
      <h2 className="text-xl font-bold text-slate-800">Cổng Nhân Viên</h2>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-slate-900 transition cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-800">Tài khoản nhân sự</p>
            <p className="text-[11px] text-emerald-600 font-semibold">Đang hoạt động</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
            NV
          </div>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;