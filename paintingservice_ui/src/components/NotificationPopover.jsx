import { useState, useEffect, useRef } from 'react';

export default function NotificationPopover({ 
  notifications, 
  onMarkRead, 
  onDeleteAll, 
  onDeleteOne, 
  color = 'blue' 
}) {
  const [show, setShow] = useState(false);
  const notiRef = useRef(null);

  // Xử lý click ra ngoài để đóng
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShow(false);
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  const togglePopover = () => {
    const nextState = !show;
    setShow(nextState);
    if (nextState && onMarkRead) {
      onMarkRead();
    }
  };

  const themes = {
    blue: {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      unread: 'bg-blue-50/20',
      hover: 'hover:bg-blue-50'
    },
    amber: {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      unread: 'bg-amber-50/20',
      hover: 'hover:bg-amber-50'
    }
  };

  const theme = themes[color] || themes.blue;

  return (
    <div className="relative" ref={notiRef}>
      <button 
        onClick={togglePopover}
        className={`relative p-2 bg-white border border-slate-200 rounded-full ${theme.hover} transition-all cursor-pointer shadow-sm`}
      >
        🔔 {notifications.some(n => !n.isRead) && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {show && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Thông báo</h3>
              <span className={`text-[10px] font-bold ${theme.text} ${theme.bg} px-2 py-0.5 rounded-full uppercase tracking-widest`}>
                {notifications.filter(n => !n.isRead).length} mới
              </span>
            </div>
            <button onClick={onDeleteAll} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-tight cursor-pointer">Xóa tất cả</button>
          </div>
          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? notifications.map(n => (
              <div key={n.id} className={`group relative p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.isRead ? theme.unread : ''}`}>
                <div className="flex justify-between items-start">
                  <div className={`font-bold ${theme.text} text-[11px] mb-1`}>{n.title}</div>
                  <button onClick={() => onDeleteOne(n.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all p-1">✕</button>
                </div>
                <p className="text-xs text-slate-600 leading-snug pr-4">{n.content}</p>
                <div className="text-[9px] text-slate-400 mt-2 font-bold tracking-tight">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            )) : <div className="text-center py-10 text-slate-400 text-xs italic">Không có thông báo nào.</div>}
          </div>
        </div>
      )}
    </div>
  );
}