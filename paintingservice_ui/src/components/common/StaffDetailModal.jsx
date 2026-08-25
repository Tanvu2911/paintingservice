import React from "react";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Award,
  Star,
  ShieldCheck,
  Calendar,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import Modal from "./Modal";

export default function StaffDetailModal({ isOpen, onClose, staff, onBook }) {
  if (!staff) return null;

  const isSupervisor = staff.staffType === "SUPERVISOR";
  const displayName = staff.fullName || staff.username || "Nhân viên kỹ thuật";
  const avatarUrl = staff.avatar;
  const rating = staff.rating || 5.0;
  const experienceYears = staff.experienceYears || 3;
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
      <div className="space-y-6">
        {/* Header Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100/50 border border-slate-200 shadow-xs">
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
            <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs text-[10px] text-white">
              ✓
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
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
                {isSupervisor ? "🔍 Giám Sát Viên" : "🛠️ Đội Thợ Thi Công"}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{rating.toFixed(1)} / 5.0</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Kinh nghiệm: <strong className="text-slate-800 font-bold">{experienceYears} năm</strong> thực tế tại Hà Nội
            </p>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Số điện thoại */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Số điện thoại liên hệ</span>
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {staff.phoneNumber || staff.phone ? (
                <a
                  href={`tel:${staff.phoneNumber || staff.phone}`}
                  className="text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>{staff.phoneNumber || staff.phone}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Gọi</span>
                </a>
              ) : (
                "Chưa cập nhật"
              )}
            </div>
          </div>

          {/* Email */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hộp thư Email</span>
            </span>
            <div className="font-bold text-slate-800 truncate">
              {staff.email || "Liên hệ qua tổng đài"}
            </div>
          </div>
        </div>

        {/* Chuyên môn / Kỹ năng */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Award className="w-4 h-4 text-amber-600" />
            <span>Kỹ năng &amp; Chuyên môn thi công:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {specialtyList.map((spec, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition"
              >
                ✓ {spec}
              </span>
            ))}
          </div>
        </div>

        {/* Khu vực phụ trách */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-4 h-4 text-rose-600" />
            <span>Khu vực nhận việc tại Hà Nội:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {serviceAreas.map((area, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 bg-rose-50 text-rose-800 rounded-lg text-xs font-medium border border-rose-200/70"
              >
                📍 {area}
              </span>
            ))}
          </div>
        </div>

        {/* Cam kết dịch vụ */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cam kết chất lượng dịch vụ Sơn Sửa 247</span>
          </div>
          <p className="text-emerald-900 leading-relaxed text-[11.5px]">
            Nhân sự đã được xác thực danh tính, đào tạo quy chuẩn thi công an toàn và bảo hành công trình đầy đủ theo hợp đồng.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đóng
          </button>
          {staff.phoneNumber && (
            <a
              href={`tel:${staff.phoneNumber}`}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi Ngay ({staff.phoneNumber})</span>
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}
