const DashboardHeader = ({ title, subtitle, userName, userRole, avatarChar, color = "blue" }) => {
  const theme = {
    blue: "from-blue-600 to-blue-400 text-white shadow-blue-100",
    amber: "from-orange-400 to-amber-500 text-slate-900 shadow-amber-100"
  }[color];

  return (
    <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-slate-400 text-sm font-medium">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-bold text-slate-900">{userName}</div>
          <div className={`text-xs font-bold uppercase tracking-wider ${color === 'blue' ? 'text-blue-600' : 'text-amber-600'}`}>
            {userRole}
          </div>
        </div>
        <div className={`w-14 h-14 rounded-3xl bg-gradient-to-br ${theme} flex items-center justify-center font-black text-2xl shadow-xl border-4 border-white`}>
          {avatarChar}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;