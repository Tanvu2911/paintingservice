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

function extractTechnicians(order, total, getSalary) {
  const workerDefault = total * 0.60;
  const srvItems = (order.bookingServices || []).filter((bs) => bs.technicianId);

  if (srvItems.length > 0) {
    const techMap = {};
    srvItems.forEach((bs) => {
      const tId = bs.technicianId;
      if (!techMap[tId]) {
        techMap[tId] = {
          id: tId,
          name: bs.technicianName || `Đội thợ #${tId}`,
          phone: bs.technicianPhone,
          services: [],
          subtotalPrice: 0,
        };
      }
      techMap[tId].services.push(bs.serviceName || "Dịch vụ");
      techMap[tId].subtotalPrice += Number(bs.price) || 0;
    });

    const totalServicePrice = srvItems.reduce((acc, cur) => acc + (Number(cur.price) || 0), 0);
    const uniqueTechs = Object.values(techMap);

    return uniqueTechs.map((tInfo) => {
      let allocatedWage = workerDefault;
      if (totalServicePrice > 0 && tInfo.subtotalPrice > 0) {
        allocatedWage = Math.round((workerDefault * tInfo.subtotalPrice) / totalServicePrice);
      } else {
        allocatedWage = Math.round(workerDefault / uniqueTechs.length);
      }
      const salaryInfo = getSalary(order.id, tInfo.id, "TECHNICIAN", allocatedWage);
      return {
        ...tInfo,
        wage: salaryInfo.amount,
        isPaid: salaryInfo.isPaid,
        salaryInfo,
      };
    });
  } else if (order.technicianId) {
    const salaryInfo = getSalary(order.id, order.technicianId, "TECHNICIAN", workerDefault);
    return [
      {
        id: order.technicianId,
        name: order.technicianName || "Đội thợ thi công",
        phone: order.technicianPhone,
        services: [order.serviceName || order.service?.name || "Thi công sơn"].filter(Boolean),
        subtotalPrice: total,
        wage: salaryInfo.amount,
        isPaid: salaryInfo.isPaid,
        salaryInfo,
      },
    ];
  }
  return [];
}

export default function StaffBookingPayoutTab({
  filteredOrders,
  getSalary,
  openPayoutQR,
  navigate,
  kpi = {},
  thCls,
  tdCls,
  search,
  handleClearSearch,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className={thCls}>Đơn hàng &amp; Khách</th>
              <th className={thCls + " text-right"}>Tổng HĐ</th>
              <th className={thCls}>Giám sát (10% + VT)</th>
              <th className={thCls}>Đội thợ (60% theo gói)</th>
              <th className={thCls + " text-center"}>Trạng thái chi</th>
              <th className={thCls + " text-right"}>Thao tác chi trả VietQR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <p>Không tìm thấy đơn hàng nào cần quyết toán{search ? ` khớp với "${search}".` : "."}</p>
                  {Boolean(search && handleClearSearch) && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-xs"
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

                const supS = getSalary(o.id, o.supervisorId, "SURVEYOR", surveyDefault);
                const hasSupervisor = Boolean(o.supervisorId);
                const supPaid = !hasSupervisor || supS.isPaid;

                // Xử lý nhiều đội thợ theo từng dịch vụ
                const technicians = extractTechnicians(o, total, getSalary);
                const hasTechnicians = technicians.length > 0;
                const allTechsPaid = !hasTechnicians || technicians.every((t) => t.isPaid);

                const isAllStaffPaid = (hasSupervisor || hasTechnicians) && supPaid && allTechsPaid;

                return (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/admin/bookings/${o.id}`)}
                    className={`transition-colors cursor-pointer group ${
                      isTargeted
                        ? "bg-blue-50/40 hover:bg-blue-50/60 ring-1 focus:ring-blue-500/20 ring-inset"
                        : "hover:bg-slate-50/70"
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
                          <p className="font-semibold text-slate-800">
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

                    {/* Đội thợ (Chi trả riêng biệt từng đội nếu có nhiều dịch vụ) */}
                    <td className={tdCls}>
                      {hasTechnicians ? (
                        <div className="space-y-2">
                          {technicians.map((t) => (
                            <div key={t.id} className="border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-800">{t.name}</span>
                                {t.services.length > 0 && (
                                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                                    {t.services.join(", ")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-bold text-slate-900 font-mono">
                                  {formatMoney(t.wage)}
                                </span>
                                <Badge ok={t.isPaid} okLabel="Đã chi" failLabel="Chưa chi" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Trạng thái chi */}
                    <td className={tdCls + " text-center"}>
                      {isAllStaffPaid ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã chi đủ
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Chờ quyết toán
                        </span>
                      )}
                    </td>

                    {/* Thao tác thanh toán VietQR riêng biệt */}
                    <td
                      className={tdCls + " text-right whitespace-nowrap"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/bookings/${o.id}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* VietQR Giám sát */}
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
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
                              title="Quét VietQR chi trả Giám sát"
                            >
                              <QrCode className="w-3 h-3" /> Trả GS
                            </button>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Chờ khách tất toán
                            </span>
                          )
                        )}

                        {/* VietQR Từng Đội thợ */}
                        {technicians.map((t) => (
                          !t.isPaid && (
                            fin.isFinalPaid ? (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() =>
                                  openPayoutQR(
                                    o,
                                    t.id,
                                    t.name,
                                    "TECHNICIAN",
                                    t.wage
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-xs"
                                title={`Quét VietQR chi trả ${t.name}`}
                              >
                                <QrCode className="w-3 h-3" /> Trả {technicians.length > 1 ? t.name : "Thợ"}
                              </button>
                            ) : (
                              <span key={t.id} className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Chờ khách tất toán
                              </span>
                            )
                          )
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap gap-6 text-slate-600">
          <span>
            Đã chi thi công:{" "}
            <strong className="text-indigo-700 font-mono font-bold">
              {formatMoney(kpi.staffPaidBookings || kpi.staffPaid || 0)}
            </strong>
          </span>
          <span>
            Chờ quyết toán thi công:{" "}
            <strong className="text-amber-700 font-mono font-bold">
              {formatMoney(kpi.staffPendingBookings || kpi.staffPending || 0)}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Số dư hệ thống hiện tại:</span>
          <span className="text-sm font-black text-emerald-700 font-mono">
            {formatMoney(kpi.systemNetBalance || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}


