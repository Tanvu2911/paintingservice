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
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition ${
           "bg-white border border-slate-200 hover:bg-slate-50"
        }`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl z-50 overflow-hidden ${
            "bg-white border border-slate-100"
          }`}
        >
          <div
            className={`px-4 py-3 border-b flex justify-between items-center ${
              "border-slate-100"
            }`}
          >
            <p className={`font-bold text-sm ${ "text-slate-800"}`}>
              Thông báo
            </p>
            {notifications.length > 0 && (
              <button onClick={onDeleteAll} className="text-xs text-rose-500 hover:underline">
                Xóa tất cả
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className={`text-center text-sm py-8 ${ "text-slate-400"}`}>
                Không có thông báo
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b flex justify-between gap-2 ${
                     `border-slate-50 hover:bg-slate-50 ${!n.isRead ? "bg-blue-50/50" : ""}`
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-sm ${ "text-slate-700"}`}>
                      {n.message || n.content}
                    </p>
                    <p className={`text-[10px] mt-1 ${ "text-slate-400"}`}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteOne?.(n.id)}
                    className={`text-xs ${"text-slate-300 hover:text-rose-500"}`}
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
