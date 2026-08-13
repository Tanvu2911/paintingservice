
const StatusBadge = ({ status }) => {
  const getStatusClass = (s) => {
    switch (s?.toUpperCase()) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20';
      case 'ASSIGNED': return 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/20';
      case 'ACCEPTED': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20';
      case 'PROCESSING': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
      case 'COMPLETED': case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
      case 'RESTRICTED': return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
      default: return 'bg-slate-50 text-slate-600 ring-1 ring-slate-500/10';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase w-fit ${getStatusClass(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;