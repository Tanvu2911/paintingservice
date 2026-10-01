import React from "react";
import { Check } from "lucide-react";
import { ORDER_STAGES, getActiveStageIndex, formatDate } from "../../../util/orderFlowUtils";

export default function OrderTimeline({ status, history = [] }) {
  const activeStage = getActiveStageIndex(status);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Tiến trình thực hiện đơn hàng
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {status === "CANCELLED"
            ? "Đã hủy đơn"
            : `Giai đoạn ${activeStage + 1} / 6: ${ORDER_STAGES[activeStage]?.title.replace(/^\d+\.\s*/, "")}`}
        </span>
      </div>

      {/* 6 Giai đoạn tiến trình */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {ORDER_STAGES.map((stg, idx) => {
          const isPassed = idx < activeStage;
          const isCurrent = idx === activeStage;
          const Icon = stg.icon;

          return (
            <div
              key={stg.id}
              className={`p-3.5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                isCurrent
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/40"
                  : isPassed
                  ? "bg-emerald-50/60 text-emerald-950 border-emerald-200"
                  : "bg-slate-50 text-slate-400 border-slate-200/80 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      isCurrent
                        ? "bg-emerald-500 text-slate-950"
                        : isPassed
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                  </div>
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 ${
                        isCurrent
                          ? "text-emerald-400"
                          : isPassed
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }`}
                    />
                  )}
                </div>

                <div
                  className={`text-xs font-bold leading-tight ${
                    isCurrent ? "text-white" : isPassed ? "text-slate-900" : "text-slate-600"
                  }`}
                >
                  {stg.title}
                </div>
              </div>

              <div
                className={`text-[10px] mt-2 leading-relaxed ${
                  isCurrent
                    ? "text-slate-300 font-medium"
                    : isPassed
                    ? "text-emerald-800 font-medium"
                    : "text-slate-400"
                }`}
              >
                {stg.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lịch sử thay đổi trạng thái nếu có */}
      {history && history.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Nhật ký chuyển giao trạng thái ({history.length})
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {history.map((h, i) => (
              <span
                key={i}
                className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 font-medium text-[11px]"
              >
                {h.fromStatus || "START"} → <strong className="text-slate-900">{h.toStatus}</strong> ({formatDate(h.timestamp || h.createdAt)})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}