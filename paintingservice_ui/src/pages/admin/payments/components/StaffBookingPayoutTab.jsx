import React from "react";
import { Eye, QrCode, Check } from "lucide-react";
import { formatMoney } from "../../../../util/formatters";
import { calculateFinancials } from "../../../../util/orderFlowUtils";

function Badge({ ok, okLabel = "Đã chi", failLabel = "Chưa chi" }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
      <Check className="w-2.5 h-2.5" /> {okLabel}
    </span>
  ) : (
    <span className="text-[10px] font-semibold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
      {failLabel}
    </span>
  );
}

export default function StaffBookingPayoutTab({
  filteredOrders,
  getSalary,
  openPayoutQR,
  navigate,
  kpi,
  thCls,
  tdCls,
  search,
  handleClearSearch,
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Đơn hàng &amp; Khách</th>
              <th className={thCls + " text-right"}>Tổng HĐ</th>
              <th className={thCls}>Giám sát (10% + VT)</th>
              <th className={thCls}>Đội thợ (60%)</th>
              <th className={thCls + " text-center"}>Trạng thái chi</th>
              <th className={thCls + " text-right"}>Thao tác chi trả VietQR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">
                  <p>Không tìm thấy đơn hàng nào cần quyết toán{search ? ` khớp với "${search}".` : "."}</p>
                  {Boolean(search && handleClearSearch) && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-600 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
                    >
                      <span>Xem tất cả các đơn hàng</span>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const isTargeted = Boolean(search && String(o.id) === String(search).trim());
                const fin = calculateFinancials(o);
                const total = fin.total;
                const surveyDefault = total * 0.10;
                const workerDefault = total * 0.60;

                const supS = getSalary(o.id, o.supervisorId, "SURVEYOR", surveyDefault);
                const worS = getSalary(o.id, o.technicianId, "TECHNICIAN", workerDefault);

                const hasSupervisor = Boolean(o.supervisorId);
                const hasTechnician = Boolean(o.technicianId);

                const supPaid = !hasSupervisor || supS.isPaid;
                const worPaid = !hasTechnician || worS.isPaid;
                const isAllStaffPaid = (hasSupervisor || hasTechnician) && supPaid && worPaid;

                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/admin/bookings/${o.id}`)}
                    className={`transition-colors cursor-pointer group ${
                      isTargeted
                        ? "bg-slate-50 hover:bg-slate-50 ring-1 focus:ring-blue-500/20 ring-inset"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">#{o.id}</span>
                        {isTargeted && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white">
                            Đang xem
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-slate-500 truncate max-w-[140px]">
                        {o.customerName || o.customer?.fullName || o.customer?.username || "—"}
                      </div>
                    </td>
                    <td className={tdCls + " text-right font-bold text-slate-900 font-mono"}>
                      {formatMoney(total)}
                    </td>

                    {/* Giám sát */}
                    <td className={tdCls}>
                      {hasSupervisor ? (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {o.supervisorName || "Giám sát"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-slate-900 font-mono">
                              {formatMoney(supS.amount)}
                            </span>
                            <Badge ok={supS.isPaid} okLabel="Đã chi" failLabel="Chưa chi" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Kỹ thuật */}
                    <td className={tdCls}>
                      {hasTechnician ? (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {o.technicianName || "Đội thợ"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-slate-900 font-mono">
                              {formatMoney(worS.amount)}
                            </span>
                            <Badge ok={worS.isPaid} okLabel="Đã chi" failLabel="Chưa chi" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Trạng thái chi */}
                    <td className={tdCls + " text-center"}>
                      {isAllStaffPaid ? (
                        <span className="text-[11px] font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã chi đủ
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          Chờ quyết toán
                        </span>
                      )}
                    </td>

                    {/* Thao tác thanh toán VietQR */}
                    <td
                      className={tdCls + " text-right whitespace-nowrap"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/bookings/${o.id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasSupervisor && !supS.isPaid && (
                          fin.isFinalPaid ? (
                            <button
                              type="button"
                              onClick={() =>
                                openPayoutQR(
                                  o,
                                  o.supervisorId,
                                  o.supervisorName || "Giám sát",
                                  "SURVEYOR",
                                  supS.amount
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-600 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
                              title="Quét VietQR chi trả Giám sát"
                            >
                              <QrCode className="w-3 h-3" /> Trả GS
                            </button>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                              Chờ khách tất toán
                            </span>
                          )
                        )}
                        {hasTechnician && !worS.isPaid && (
                          fin.isFinalPaid ? (
                            <button
                              type="button"
                              onClick={() =>
                                openPayoutQR(
                                  o,
                                  o.technicianId,
                                  o.technicianName || "Kỹ thuật viên",
                                  "TECHNICIAN",
                                  worS.amount
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-600 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
                              title="Quét VietQR chi trả Đội thợ"
                            >
                              <QrCode className="w-3 h-3" /> Trả Thợ
                            </button>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                              Chờ khách tất toán
                            </span>
                          )
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

      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap gap-6 text-slate-500">
          <span>
            Đã chi thi công:{" "}
            <strong className="text-slate-900 font-mono font-bold">
              {formatMoney(kpi.staffPaidBookings)}
            </strong>
          </span>
          <span>
            Chờ quyết toán thi công:{" "}
            <strong className="text-slate-900 font-mono font-bold">
              {formatMoney(kpi.staffPendingBookings)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}


