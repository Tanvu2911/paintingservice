import React from "react";
import { Eye, QrCode, Sparkles, ShieldCheck, Check } from "lucide-react";
import { formatMoney } from "../../../../util/formatters";

function Badge({ ok, okLabel = "Đã chi", failLabel = "Chưa chi" }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <Check className="w-2.5 h-2.5" /> {okLabel}
    </span>
  ) : (
    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      {failLabel}
    </span>
  );
}

export default function StaffWarrantyPayoutTab({
  filteredWarrantyClaims = [],
  openWarrantyPayoutQR,
  navigate,
  kpi = {},
  thCls = "px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider",
  tdCls = "px-4 py-3.5",
  search = "",
  handleClearSearch,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <span className="font-bold text-xs text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Danh Sách Quyết Toán Tiền Công Thợ &amp; Giám Sát Bảo Hành</span>
          </span>
          <p className="text-[11px] text-slate-500">
            Đơn lỗi thi công: Hệ thống chi trả thù lao &bull; Đơn phát sinh khách quan: Chuyển tiền từ khách sang trả công thợ
          </p>
        </div>
        <div className="text-xs font-bold text-slate-700 font-mono flex items-center gap-3">
          <span>
            Đã chi công BH: <strong className="text-emerald-700">{formatMoney(kpi.warrantyStaffPaidTotal || 0)}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Chờ chi công BH:{" "}
            <strong className="text-amber-700">{formatMoney(kpi.warrantyStaffPendingTotal || 0)}</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Phiếu BH &amp; Đơn gốc</th>
              <th className={thCls}>Khách hàng &amp; Phân loại</th>
              <th className={thCls + " text-right"}>Nguồn tiền / Khách trả</th>
              <th className={thCls}>Tiền công Giám sát</th>
              <th className={thCls}>Tiền công Đội thợ</th>
              <th className={thCls + " text-center"}>Trạng thái chi</th>
              <th className={thCls + " text-right"}>Thao tác chi trả VietQR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {filteredWarrantyClaims.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400">
                  <p>Chưa có phiếu bảo hành nào{search ? ` khớp với "${search}".` : " theo bộ lọc."}</p>
                  {Boolean(search && handleClearSearch) && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
                    >
                      <span>Xem tất cả phiếu bảo hành</span>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredWarrantyClaims.map((c) => {
                const isTargeted = Boolean(
                  search &&
                    (String(c.id) === String(search).trim() ||
                      String(c.bookingId) === String(search).trim())
                );
                const supportPrice = Number(c.finalSupportPrice) || Number(c.suggestedPrice) || 0;
                const isCustomerFault =
                  c.faultType === "CUSTOMER_FAULT" || supportPrice > 0;
                const isOldWorker = Boolean(
                  c.technicianId &&
                  c.previousTechnicianId &&
                  String(c.technicianId) === String(c.previousTechnicianId)
                );

                let defaultWorkerAmt = 200000;
                let workerDesc = "Thợ mới (Công ty chi)";
                if (isCustomerFault) {
                  defaultWorkerAmt = supportPrice > 0 ? Math.round(supportPrice * 0.60) : 200000;
                  workerDesc = "Hưởng 60% tiền khách";
                } else if (isOldWorker) {
                  defaultWorkerAmt = 0;
                  workerDesc = "Thợ cũ (0đ - Trách nhiệm)";
                }

                let defaultSurveyorAmt = 100000;
                let surveyorDesc = "Định mức công ty";
                if (isCustomerFault) {
                  defaultSurveyorAmt = supportPrice > 0 ? Math.round(supportPrice * 0.10) : 100000;
                  surveyorDesc = "Hưởng 10% tiền khách";
                }

                const surAmt = c.surveyorSalary != null ? Number(c.surveyorSalary) : defaultSurveyorAmt;
                const worAmt = c.workerSalary != null ? Number(c.workerSalary) : defaultWorkerAmt;

                if (c.workerSalary != null) {
                  workerDesc = "Thù lao do Admin ấn định";
                }
                if (c.surveyorSalary != null) {
                  surveyorDesc = "Thù lao do Admin ấn định";
                }

                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/warranties/${c.id}`)}
                    className={`transition-colors cursor-pointer group ${
                      isTargeted
                        ? "bg-blue-50/70 hover:bg-blue-50 ring-1 ring-blue-500/20 ring-inset"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">BH #{c.id}</span>
                        {isTargeted && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white">
                            Đang xem
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-blue-700 font-bold">Đơn #{c.bookingId}</div>
                    </td>

                    {/* Phân loại lỗi */}
                    <td className={tdCls}>
                      <p className="font-bold text-slate-800">{c.customerName || "Khách hàng"}</p>
                      <div className="pt-0.5">
                        {isCustomerFault ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-2.5 h-2.5 text-purple-600" /> Lỗi khách quan (Khách trả)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-2.5 h-2.5 text-blue-600" /> Lỗi kỹ thuật (Công ty chi)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Nguồn tiền chi trả thợ */}
                    <td className={tdCls + " text-right font-mono"}>
                      {isCustomerFault ? (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            +{formatMoney(supportPrice)}
                          </div>
                          <div className="text-[10px] font-medium">
                            {c.customerPaid ? (
                              <span className="text-emerald-700">✓ Đã thu tiền khách</span>
                            ) : (
                              <span className="text-amber-600">⏳ Chờ khách thanh toán</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-600 text-xs">0đ từ khách</div>
                          <div className="text-[10px] text-blue-700 font-semibold">
                            Hệ thống bảo hành chi trả
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Thù lao Giám sát */}
                    <td className={tdCls}>
                      {c.surveyorId ? (
                        <div>
                          <p className="font-semibold text-slate-800">
                            {c.surveyorName || "Giám sát viên"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-slate-900 font-mono">
                              {formatMoney(surAmt)}
                            </span>
                            {surAmt === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Check className="w-2.5 h-2.5" /> Trách nhiệm (0đ)
                              </span>
                            ) : (
                              <Badge ok={c.surveyorPaid} okLabel="Đã chi" failLabel="Chưa chi" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{surveyorDesc}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa phân GS</span>
                      )}
                    </td>

                    {/* Thù lao Đội thợ */}
                    <td className={tdCls}>
                      {c.technicianId ? (
                        <div>
                          <p className="font-semibold text-slate-800">
                            {c.technicianName || "Đội thợ"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-slate-900 font-mono">
                              {formatMoney(worAmt)}
                            </span>
                            {worAmt === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Check className="w-2.5 h-2.5" /> Trách nhiệm (0đ)
                              </span>
                            ) : (
                              <Badge ok={c.workerPaid} okLabel="Đã chi" failLabel="Chưa chi" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{workerDesc}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa phân thợ</span>
                      )}
                    </td>

                    {/* Trạng thái chi */}
                    <td className={tdCls + " text-center"}>
                      {(c.surveyorPaid || surAmt === 0) && (c.workerPaid || worAmt === 0) ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã chi đủ công
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Chờ quyết toán
                        </span>
                      )}
                    </td>

                    {/* Thao tác chi trả VietQR */}
                    <td
                      className={tdCls + " text-right whitespace-nowrap"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/warranties/${c.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết phiếu bảo hành"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {c.surveyorId && !c.surveyorPaid && surAmt > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              openWarrantyPayoutQR(
                                c,
                                c.surveyorId,
                                c.surveyorName,
                                "SURVEYOR",
                                surAmt,
                                { payoutNote: surveyorDesc }
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
                            title="Quét VietQR trả công Giám sát"
                          >
                            <QrCode className="w-3 h-3" /> Trả GS
                          </button>
                        )}

                        {c.technicianId && !c.workerPaid && worAmt > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              openWarrantyPayoutQR(
                                c,
                                c.technicianId,
                                c.technicianName,
                                "TECHNICIAN",
                                worAmt,
                                { payoutNote: workerDesc }
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
                            title="Quét VietQR trả công Đội thợ"
                          >
                            <QrCode className="w-3 h-3" /> Trả Thợ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
