import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const Toast = ({ message, type = "success", title, onClose, duration = 3500 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 20);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const config = {
    success: {
      title: title || "Thành công",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      iconBg: "bg-emerald-50 border-emerald-100",
      accentBar: "bg-emerald-600",
      progressBg: "bg-emerald-600",
    },
    error: {
      title: title || "Lỗi thao tác",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      iconBg: "bg-rose-50 border-rose-100",
      accentBar: "bg-rose-600",
      progressBg: "bg-rose-600",
    },
    warning: {
      title: title || "Cảnh báo",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      iconBg: "bg-amber-50 border-amber-100",
      accentBar: "bg-amber-600",
      progressBg: "bg-amber-600",
    },
    info: {
      title: title || "Thông báo",
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      iconBg: "bg-blue-50 border-blue-100",
      accentBar: "bg-blue-600",
      progressBg: "bg-blue-600",
    },
  }[type] || {
    title: title || "Thông báo",
    icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    iconBg: "bg-blue-50 border-blue-100",
    accentBar: "bg-blue-600",
    progressBg: "bg-blue-600",
  };

  const displayMessage =
    typeof message === "object" && message !== null
      ? message.message ||
        (Array.isArray(message.messages) ? message.messages.join(", ") : message.error) ||
        JSON.stringify(message)
      : String(message || "");

  return (
    <div className="fixed top-5 right-5 z-[99999] max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="relative bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl shadow-slate-900/15 border border-slate-200/90 overflow-hidden">
        <div className="p-4 flex items-start gap-3.5">
          {/* Icon Badge */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${config.iconBg}`}
          >
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {config.title}
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5 break-words">
              {displayMessage}
            </p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 -mr-1 -mt-1"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto Dismiss Progress Bar */}
        <div className="h-1 w-full bg-slate-100">
          <div
            className={`h-full transition-all ease-linear duration-75 ${config.progressBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;