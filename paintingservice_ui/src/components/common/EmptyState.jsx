export default function EmptyState({
  message = "Chưa có dữ liệu.",
  actionText,
  onAction,
}) {
  return (
    <div className="bg-white p-10 rounded-2xl text-center text-slate-400 border border-slate-100 shadow-sm space-y-3">
      <p className="text-base text-slate-500">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-semibold transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
