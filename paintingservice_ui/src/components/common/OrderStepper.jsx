import React from "react";
import { Check } from "lucide-react";
import { ORDER_STAGES, getActiveStageIndex } from "../../util/orderFlowUtils";

export default function OrderStepper({
  status,
  compact = false,
  title = "Tiến trình thực hiện công trình",
  className = "",
}) {
  const activeStage = getActiveStageIndex(status);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-200">
          {status === "CANCELLED"
            ? "Đã hủy"
            : `Giai đoạn ${activeStage + 1} / 6`}
        </span>
      </div>

      <div className={`grid grid-cols-2 ${compact ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-3 md:grid-cols-6"} gap-2`}>
        {ORDER_STAGES.map((stg, idx) => {
          const isPassed = idx < activeStage;
          const isCurrent = idx === activeStage;

          return (
            <div
              key={stg.id}
              className={`p-3 rounded-2xl border transition relative flex flex-col justify-between ${
                isCurrent
                  ? "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md ring-2 ring-amber-400/50"
                  : isPassed
                  ? "bg-blue-50/50 text-slate-900 border-blue-100"
                  : "bg-slate-50/50 text-slate-400 border-slate-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isCurrent
                        ? "text-amber-400"
                        : isPassed
                        ? "text-[#1E3A8A]"
                        : "text-slate-400"
                    }`}
                  >
                    Bước {idx + 1}
                  </span>
                  <span className="text-xs font-bold">
                    {isPassed ? (
                      <Check className="w-3.5 h-3.5 text-[#1E3A8A] stroke-[3]" />
                    ) : isCurrent ? (
                      "●"
                    ) : (
                      "○"
                    )}
                  </span>
                </div>

                <div
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? "text-white"
                      : isPassed
                      ? "text-slate-800"
                      : "text-slate-600"
                  }`}
                >
                  {stg.title.replace(/^\d+\.\s*/, "")}
                </div>
              </div>

              {!compact && (
                <div
                  className={`text-[10px] mt-0.5 line-clamp-1 ${
                    isCurrent ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {stg.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
