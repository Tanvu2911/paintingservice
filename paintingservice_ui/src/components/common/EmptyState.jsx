export default function EmptyState({
  message = "Chưa có dữ liệu.",
  actionText,
  onAction,
  variant = "light",
}) {
  const isDark = variant === "dark";

  return (
    <div
      className={`p-10 rounded-2xl text-center space-y-3 ${
        isDark
          ? "bg-slate-800/60 border border-slate-700/60 text-slate-500"
          : "bg-white text-slate-400 border border-slate-100 shadow-sm"
      }`}
    >
      <p className={`text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}>{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            isDark
              ? "bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
