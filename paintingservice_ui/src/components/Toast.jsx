import  { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Tự động đóng sau 3 giây
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500 shadow-emerald-500/20 text-white",
    error: "bg-rose-500 shadow-rose-500/20 text-white",
    info: "bg-blue-500 shadow-blue-500/20 text-white",
    warning: "bg-amber-500 shadow-amber-500/20 text-white"
  }[type];

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️"
  }[type];

  return (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-10 duration-300 font-bold ${styles}`}>
      <span className="text-xl">{icons}</span>
      <div className="flex flex-col">
        <p className="text-sm">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
        ✕
      </button>
    </div>
  );
};

export default Toast;