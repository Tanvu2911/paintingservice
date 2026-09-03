import React from "react";
import {
  MapPin,
  Award,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Modal from "./Modal";

export default function StaffDetailModal({ isOpen, onClose, staff, onBook }) {
  if (!staff) return null;

  const isSupervisor = staff.staffType === "SUPERVISOR";
  const displayName = staff.fullName || staff.username || "Nhân viên kỹ thuật";
  const avatarUrl = staff.avatar;
  const rating = staff.rating || 5.0;
  const specialtyList = staff.specialty
    ? staff.specialty.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Sơn nhà trọn gói", "Sơn bả thẩm mỹ", "Chống thấm dột"];
  const serviceAreas = staff.serviceArea
    ? staff.serviceArea.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Các quận nội thành Hà Nội"];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSupervisor ? "Hồ Sơ Giám Sát Viên Khảo Sát" : "Hồ Sơ Đội Thợ Thi Công"}
      size="md"
    >
      <div className="space-y-5 text-xs">
        {/* Header Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100/60 border border-slate-200 shadow-xs">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-slate-200"
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center font-black text-3xl shadow-md border-2 border-white ring-2 ring-slate-200 ${
                  isSupervisor
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                    : "bg-gradient-to-tr from-emerald-600 to-teal-600 text-white"
                }`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs text-[10px] text-white font-bold">
              ✓
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                {displayName}
              </h3>
              {staff.username && staff.username !== displayName && (
                <span className="text-xs text-slate-400 font-semibold">@{staff.username}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isSupervisor
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {isSupervisor ? "🔍 Giám Sát Khảo Sát" : "🛠️ Đội Thợ Thi Công"}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{rating.toFixed(1)} / 5.0</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Trạng thái: <strong className="text-emerald-700 font-bold">● Đang sẵn sàng nhận lịch thi công</strong>
            </p>
          </div>
        </div>

        {/* Chuyên môn / Kỹ năng */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Kỹ năng &amp; Chuyên môn:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {specialtyList.map((spec, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold border border-slate-200 transition"
              >
                ✓ {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Khu vực phụ trách */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Khu vực hoạt động tại Hà Nội:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {serviceAreas.map((area, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-medium border border-emerald-200/70"
              >
                📍 {area}
              </span>
            ))}
          </div>
        </div>

        {/* Cam kết dịch vụ */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cam kết chất lượng dịch vụ Sơn Sửa 247</span>
          </div>
          <p className="text-emerald-900 leading-relaxed text-[11px]">
            Nhân sự đã được xác thực danh tính, đào tạo quy chuẩn thi công an toàn và bảo hành công trình đầy đủ theo hợp đồng điện tử.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
          {onBook && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBook(staff);
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Đặt Lịch Với Thợ Này</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
