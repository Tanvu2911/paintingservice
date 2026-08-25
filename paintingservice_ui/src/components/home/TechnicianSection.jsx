import { useState } from "react";
import { Star, ShieldCheck, MapPin, Award, CheckCircle2, ArrowRight } from "lucide-react";
import StaffDetailModal from "../common/StaffDetailModal";

const DEFAULT_SAMPLE_TECHNICIANS = [
  {
    id: 991,
    username: "nguyen_van_hoang",
    fullName: "Nguyễn Văn Hoàng",
    specialty: "Sơn Nội Thất, Sơn Hiệu Ứng",
    serviceArea: "Cầu Giấy, Nam Từ Liêm, Thanh Xuân",
    experienceYears: 6,
    rating: 4.9,
    phoneNumber: "0987123456",
    staffType: "WORKER",
  },
  {
    id: 992,
    username: "tran_dinh_tuan",
    fullName: "Trần Đình Tuấn",
    specialty: "Sơn Ngoại Thất, Chống Thấm Trần Tường",
    serviceArea: "Đống Đa, Ba Đình, Hoàn Kiếm",
    experienceYears: 8,
    rating: 5.0,
    phoneNumber: "0912345678",
    staffType: "WORKER",
  },
  {
    id: 993,
    username: "le_van_minh",
    fullName: "Lê Văn Minh",
    specialty: "Sơn Phủ Dulux, Sơn Sàn Epoxy",
    serviceArea: "Hai Bà Trưng, Hoàng Mai, Hà Đông",
    experienceYears: 5,
    rating: 4.8,
    phoneNumber: "0934567890",
    staffType: "WORKER",
  },
  {
    id: 994,
    username: "pham_quang_dung",
    fullName: "Phạm Quang Dũng",
    specialty: "Chống Rêu Mốc, Sơn Giả Đá",
    serviceArea: "Tây Hồ, Long Biên, Gia Lâm",
    experienceYears: 7,
    rating: 4.9,
    phoneNumber: "0978901234",
    staffType: "WORKER",
  },
];

function TechnicianCard({ tech, idx, onClick }) {
  const name = tech.fullName || `@${tech.username}` || "Thợ thi công";
  const experience = tech.experienceYears ? `${tech.experienceYears} năm kinh nghiệm` : "5+ năm kinh nghiệm";
  const rating = tech.rating || 4.9;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group cursor-pointer active:scale-[0.99] relative overflow-hidden"
    >
      {/* Top Background Gradient Banner */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-b border-slate-100 pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Info Header */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <div className="relative">
            {tech.avatar ? (
              <img
                src={tech.avatar}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-emerald-200 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-3xl flex items-center justify-center shadow-md border-2 border-white ring-2 ring-emerald-200 group-hover:scale-105 transition-transform">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-xs" title="Sẵn sàng nhận việc">
              ✓
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-xs">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{rating} / 5</span>
            </span>
            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1.5">
              <ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" /> Thợ Chính Hãng
            </span>
          </div>
        </div>

        {/* Name and Specialty */}
        <div>
          <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
            <span>{name}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            @{tech.username || "tho_thi_cong"} · <span className="text-emerald-700 font-bold">{experience}</span>
          </p>
        </div>

        {/* Service Area */}
        <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Khu vực phụ trách (HN):</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate" title={tech.serviceArea || "Toàn Hà Nội"}>
            {tech.serviceArea || "Toàn khu vực Hà Nội"}
          </p>
        </div>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1">
          {(tech.specialty || "Sơn Nội Thất, Chống Thấm")
            .split(",")
            .slice(0, 3)
            .map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md text-[10px] font-bold truncate max-w-[130px]"
              >
                {s.trim()}
              </span>
            ))}
        </div>
      </div>

      {/* Footer action button */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
        <span>Xem Hồ Sơ &amp; Đánh Giá</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-20 h-20 rounded-2xl bg-slate-100" />
          <div className="w-16 h-5 rounded-full bg-slate-100" />
        </div>
        <div className="h-5 w-3/4 bg-slate-100 rounded" />
        <div className="h-12 w-full bg-slate-100 rounded-2xl" />
      </div>
      <div className="h-4 w-1/2 bg-slate-100 rounded mt-6" />
    </div>
  );
}

export default function TechnicianSection({ technicians = [], loading = false }) {
  const [selectedTech, setSelectedTech] = useState(null);
  
  // Mix backend workers with default sample master painters if empty
  const rawList = Array.isArray(technicians) && technicians.length > 0 ? technicians : DEFAULT_SAMPLE_TECHNICIANS;
  const featured = rawList.slice(0, 4);

  return (
    <section className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/80">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 shadow-xs">
          Đội Ngũ Nhân Sự Tận Tâm
        </span>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
          Kỹ Thuật Viên &amp; Đội Thợ Lành Nghề
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          Mỗi kỹ thuật viên đều được tuyển chọn nghiêm ngặt, đào tạo bài bản và có thâm niên từ 5 năm trở lên. Bấm để xem chi tiết hồ sơ &amp; tay nghề.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : featured.map((tech, idx) => (
              <TechnicianCard
                key={tech.userId ?? tech.id ?? idx}
                tech={tech}
                idx={idx}
                onClick={() => setSelectedTech(tech)}
              />
            ))}
      </div>

      {selectedTech && (
        <StaffDetailModal
          isOpen={Boolean(selectedTech)}
          onClose={() => setSelectedTech(null)}
          staff={selectedTech}
        />
      )}
    </section>
  );
}
