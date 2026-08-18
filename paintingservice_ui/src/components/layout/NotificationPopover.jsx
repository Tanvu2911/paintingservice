import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2, X, ChevronRight, ExternalLink } from "lucide-react";
import { getNotificationDestination } from "../../util/notificationUtils";

export default function NotificationPopover({
  notifications = [],
  onMarkRead,
  onDeleteAll,
  onDeleteOne,
  user,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (n) => {
    const destination = getNotificationDestination(n, user);
    if (!n.isRead && onMarkRead) {
      onMarkRead();
    }
    setOpen(false);
    if (destination) {
      navigate(destination);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) onMarkRead?.();
        }}
        aria-label="Thông báo"
        className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-xs"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl shadow-xl z-50 overflow-hidden bg-white border border-slate-100 animate-in fade-in duration-150">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
            <div className="flex items-center gap-2">
              <p className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Thông báo
              </p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
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
                className="text-xs text-slate-500 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>

          <div className="max-h-88 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium">Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((n) => {
                const destination = getNotificationDestination(n, user);
                const titleText = n.title || n.message || "Thông báo";
                const contentText = n.content || n.message || "";

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`group relative p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/90 transition cursor-pointer ${
                      !n.isRead ? "bg-emerald-50/30 font-medium" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? "bg-emerald-600" : "bg-transparent"}`} />
                      <div className="min-w-0 flex-1">
                        {titleText && (
                          <p className="text-xs font-bold text-slate-900 leading-snug truncate group-hover:text-emerald-700 transition">
                            {titleText}
                          </p>
                        )}
                        {contentText && contentText !== titleText && (
                          <p className="text-xs text-slate-600 leading-relaxed mt-0.5 line-clamp-2">
                            {contentText}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5 pt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : ""}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
