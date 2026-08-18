import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, X, ChevronRight } from 'lucide-react';
import { getNotificationDestination } from '../util/notificationUtils';

export default function NotificationPopover({ 
  notifications = [], 
  onMarkRead, 
  onDeleteAll, 
  onDeleteOne, 
  user,
}) {
  const [show, setShow] = useState(false);
  const notiRef = useRef(null);
  const navigate = useNavigate();

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

  const handleItemClick = (n) => {
    const destination = getNotificationDestination(n, user);
    if (!n.isRead && onMarkRead) {
      onMarkRead();
    }
    setShow(false);
    if (destination) {
      navigate(destination);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={notiRef}>
      <button 
        type="button"
        onClick={togglePopover}
        aria-label="Thông báo"
        className="relative p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteAll?.();
                }} 
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const destination = getNotificationDestination(n, user);
                const titleText = n.title || n.message || "Thông báo";
                const contentText = n.content || n.message || "";

                return (
                  <div 
                    key={n.id} 
                    onClick={() => handleItemClick(n)}
                    className={`group relative p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/90 transition-colors cursor-pointer ${
                      !n.isRead ? 'bg-emerald-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? "bg-emerald-600" : "bg-transparent"}`} />
                      <div className="min-w-0 flex-1">
                        {titleText && (
                          <div className="font-bold text-slate-900 text-xs leading-snug truncate group-hover:text-emerald-700 transition">
                            {titleText}
                          </div>
                        )}
                        {contentText && contentText !== titleText && (
                          <p className="text-xs text-slate-600 leading-relaxed mt-0.5 line-clamp-2">
                            {contentText}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5 pt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                          </span>
                          {destination && (
                            <span className="text-[10px] font-bold text-emerald-700 group-hover:underline flex items-center gap-0.5">
                              <span>Xem chi tiết</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOne?.(n.id);
                      }} 
                      className="text-slate-300 hover:text-rose-500 transition p-1 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
                      title="Xóa thông báo này"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium">Không có thông báo mới</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}