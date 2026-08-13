export default function OrderTimeline({ history = [] }) {
  if (!history.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Lịch sử trạng thái</h3>
        <p className="text-slate-400 text-sm">Chưa có lịch sử</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-6">Lịch sử trạng thái</h3>
      <div className="space-y-0">
        {history.map((h, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-blue-600" : "bg-slate-300"}`} />
              {idx < history.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
            </div>
            <div className="pb-6">
              <p className="font-semibold text-slate-800 text-sm">{h.statusLabel || h.status}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {h.createdAt ? new Date(h.createdAt).toLocaleString("vi-VN") : ""}
                {h.actorName ? ` • ${h.actorName}` : ""}
              </p>
              {h.note && <p className="text-sm text-slate-600 mt-1">{h.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}