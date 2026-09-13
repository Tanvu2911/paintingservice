import { useState } from "react";
import { Star, ShieldCheck, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import StaffDetailModal from "../common/StaffDetailModal";
import ScrollReveal from "../common/ScrollReveal";

const DEFAULT_SAMPLE_TECHNICIANS = [
  {
    id: 991,
    username: "nguyen_van_hoang",
    fullName: "Nguyễn Văn Hoàng",
    specialty: "Sơn Nội Thất & Hiệu Ứng",
    serviceArea: "Cầu Giấy, Nam Từ Liêm",
    rating: 4.9,
    staffType: "WORKER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: 992,
    username: "tran_dinh_tuan",
    fullName: "Trần Đình Tuấn",
    specialty: "Sơn Ngoại Thất & Chống Thấm",
    serviceArea: "Đống Đa, Ba Đình",
    rating: 5.0,
    staffType: "WORKER",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: 993,
    username: "le_van_minh",
    fullName: "Lê Văn Minh",
    specialty: "Sơn Phủ & Sơn Sàn Epoxy",
    serviceArea: "Hai Bà Trưng, Hoàng Mai",
    rating: 4.8,
    staffType: "WORKER",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: 994,
    username: "pham_quang_dung",
    fullName: "Phạm Quang Dũng",
    specialty: "Chống Thấm & Sơn Bả Cao Cấp",
    serviceArea: "Tây Hồ, Long Biên",
    rating: 4.9,
    staffType: "WORKER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  },
];

function TechnicianCard({ tech, onClick }) {
  const name = tech.fullName || `@${tech.username}` || "Thợ thi công";
  const rating = tech.rating || 4.9;
  const specialty = tech.specialty ? tech.specialty.split(",")[0].trim() : "Sơn nhà trọn gói";
  const area = tech.serviceArea ? tech.serviceArea.split(",")[0].trim() : "Hà Nội";

  return (
    <div
      onClick={onClick}
      className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-200 bg-slate-900"
    >
      {/* Full Box Photo */}
      {tech.avatar ? (
        <img
          src={tech.avatar}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-950 flex items-center justify-center text-white text-6xl font-black group-hover:scale-105 transition-transform duration-500">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Top Floating Badge */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-900 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>{Number(rating).toFixed(1)}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-sm">
          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Thợ chính hãng
        </span>
      </div>

      {/* Dark Gradient Overlay with Basic Info */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-5 text-white pointer-events-none">
        <div className="space-y-1.5 transform group-hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center gap-1.5">
            <h4 className="font-black text-white text-lg tracking-tight truncate drop-shadow-sm">
              {name}
            </h4>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
            <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-[11px] font-medium">
              {specialty}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-300">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{area}</span>
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors border-t border-white/15 mt-2">
            <span>Xem chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="aspect-[3/4] sm:aspect-[4/5] rounded-3xl bg-slate-200 animate-pulse" />
  );
}

export default function TechnicianSection({ technicians = [], loading = false }) {
  const [selectedTech, setSelectedTech] = useState(null);

  // Mix backend workers with default sample master painters if empty
  const rawList = Array.isArray(technicians) && technicians.length > 0 ? technicians : DEFAULT_SAMPLE_TECHNICIANS;
  const featured = rawList.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-teal-50/20 to-slate-50 py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 -left-20 w-[28rem] h-[28rem] bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-[28rem] h-[28rem] bg-teal-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 shadow-xs">
            Đội Ngũ Nhân Sự Tận Tâm
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3.5">
            Kỹ Thuật Viên &amp; Đội Thợ Lành Nghề
          </h3>
          <p className="text-sm text-slate-500 mt-2.5">
            Mỗi kỹ thuật viên đều được xác thực danh tính và có tay nghề cao. Bấm vào ảnh để xem chi tiết hồ sơ.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : featured.map((tech, idx) => (
                <ScrollReveal
                  key={tech.userId ?? tech.id ?? idx}
                  animation="fade-up"
                  delay={idx * 130}
                  className="h-full"
                >
                  <TechnicianCard
                    tech={tech}
                    onClick={() => setSelectedTech(tech)}
                  />
                </ScrollReveal>
              ))}
        </div>

        {selectedTech && (
          <StaffDetailModal
            isOpen={Boolean(selectedTech)}
            onClose={() => setSelectedTech(null)}
            staff={selectedTech}
          />
        )}
      </div>
    </section>
  );
}
