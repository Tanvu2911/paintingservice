import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2, X, ChevronRight, CheckCheck, Check } from "lucide-react";
import { getNotificationDestination } from "../../util/notificationUtils";

export default function NotificationPopover({
  notifications = [],
  onMarkRead,
  onMarkSingleRead,
  onMarkAllRead,
  onDeleteAll,
  onDeleteOne,
  user,
}) {
  const [open, setOpen] = useState(false);
  const [filterTab, setFilterTab] = useState("all"); // "all" | "unread"
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

    // Đánh dấu đọc riêng tin này nếu chưa đọc
    if (!n.isRead) {
      if (onMarkSingleRead) {
        onMarkSingleRead(n.id);
      } else if (onMarkRead) {
        onMarkRead(n.id);
      }
    }

    setOpen(false);
    if (destination) {
      navigate(destination);
    }
  };

  const handleReadAllClick = (e) => {
    e.stopPropagation();
    if (onMarkAllRead) {
      onMarkAllRead();
    } else if (onMarkRead) {
      onMarkRead();
    }
  };

  const displayedNotifications = useMemo(() => {
    if (filterTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filterTab]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
        className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-xs"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl shadow-xl z-50 overflow-hidden bg-white border border-slate-200 animate-zoom-in origin-top-right">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/90">
            <div className="flex items-center gap-2">
              <p className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Thông báo
              </p>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleReadAllClick}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition flex items-center gap-1 cursor-pointer"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đọc tất cả</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAll?.();
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                  title="Xóa tất cả thông báo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs (Tất cả / Chưa đọc) */}
          <div className="flex border-b border-slate-100 bg-white text-xs px-2 pt-1">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`py-1.5 px-3 font-semibold rounded-lg transition cursor-pointer text-xs ${
                filterTab === "all"
                  ? "text-blue-600 bg-blue-50/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unread")}
              className={`py-1.5 px-3 font-semibold rounded-lg transition cursor-pointer text-xs ${
                filterTab === "unread"
                  ? "text-blue-600 bg-blue-50/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="max-h-88 overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium">
                  {filterTab === "unread"
                    ? "Bạn đã đọc hết mọi thông báo!"
                    : "Không có thông báo nào"}
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => {
                const destination = getNotificationDestination(n, user);
                const titleText = n.title || n.message || "Thông báo";
                const contentText = n.content || n.message || "";
                const isUnread = !n.isRead;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`group relative p-3 flex items-start justify-between gap-3 transition cursor-pointer border-l-4 ${
                      isUnread
                        ? "bg-blue-50/60 hover:bg-blue-100/50 border-l-blue-600"
                        : "bg-white hover:bg-slate-50 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Chấm tròn báo trạng thái */}
                      {isUnread ? (
                        <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 bg-blue-600" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0 bg-slate-300" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                              MỚI
                            </span>
                          )}
                          <p
                            className={`text-xs leading-snug truncate group-hover:text-blue-700 transition ${
                              isUnread
                                ? "font-black text-slate-900"
                                : "font-semibold text-slate-600"
                            }`}
                          >
                            {titleText}
                          </p>
                        </div>
                        {contentText && contentText !== titleText && (
                          <p
                            className={`text-xs leading-relaxed mt-0.5 line-clamp-2 ${
                              isUnread ? "text-slate-800 font-medium" : "text-slate-400"
                            }`}
                          >
                            {contentText}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5 pt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleString("vi-VN")
                              : ""}
                          </span>
                          {destination && (
                            <span className="text-[10px] font-bold text-blue-700 group-hover:underline flex items-center gap-0.5">
                              <span>Xem chi tiết</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onMarkSingleRead) {
                              onMarkSingleRead(n.id);
                            } else if (onMarkRead) {
                              onMarkRead(n.id);
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 transition p-1 rounded-lg hover:bg-blue-100/80 cursor-pointer"
                          title="Đánh dấu đã đọc"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOne?.(n.id);
                        }}
                        className="text-slate-300 hover:text-rose-500 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Xóa thông báo này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
