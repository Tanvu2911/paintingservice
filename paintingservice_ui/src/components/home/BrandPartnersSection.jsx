import { ShieldCheck } from "lucide-react";

const BRAND_PARTNERS = [
  { name: "Dulux", desc: "Sơn nội & ngoại thất cao cấp", color: "from-blue-400 to-sky-300" },
  { name: "Jotun", desc: "Bảo vệ tối ưu chống bám bẩn", color: "from-sky-400 to-indigo-300" },
  { name: "Kova", desc: "Chuyên gia chống thấm nhiệt đới", color: "from-amber-400 to-orange-300" },
  { name: "Nippon Paint", desc: "Thân thiện môi trường", color: "from-rose-400 to-pink-300" },
  { name: "Mykolor", desc: "Màu sắc rực rỡ nghệ thuật", color: "from-purple-400 to-indigo-300" },
];

export default function BrandPartnersSection() {
  return (
    <section id="partners" className="relative overflow-hidden bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-center">
      <div className="max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 shadow-xs mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đối Tác Phân Phối Sơn Chính Hãng 100%</span>
        </div>
        <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Hợp Tác Chiến Lược Với Các Thương Hiệu Sơn Hàng Đầu
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 mt-10 items-center">
          {BRAND_PARTNERS.map((brand, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 hover:border-slate-500 hover:bg-slate-800 hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-1"
            >
              <div className="h-10 flex items-center justify-center mb-2">
                <span className={`text-xl font-black tracking-tight bg-gradient-to-r ${brand.color} bg-clip-text text-transparent group-hover:scale-105 transition-transform`}>
                  {brand.name}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block leading-tight">
                {brand.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
