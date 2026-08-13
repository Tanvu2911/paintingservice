import { useState, useRef, useEffect } from "react";

export default function NotificationPopover({
  notifications = [],
  onMarkRead,
  onDeleteAll,
  onDeleteOne,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) onMarkRead?.();
        }}
        className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
            <p className="font-bold text-slate-800 text-sm">Thông báo</p>
            {notifications.length > 0 && (
              <button onClick={onDeleteAll} className="text-xs text-rose-500 hover:underline">
                Xóa tất cả
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Không có thông báo</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex justify-between gap-2 ${
                    !n.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{n.message || n.content}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteOne?.(n.id)}
                    className="text-slate-300 hover:text-rose-500 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}