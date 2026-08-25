const BRAND_PARTNERS = [
  { name: "Dulux", desc: "Sơn nội & ngoại thất cao cấp" },
  { name: "Jotun", desc: "Bảo vệ tối ưu chống bám bẩn" },
  { name: "Kova", desc: "Chuyên gia chống thấm nhiệt đới" },
  { name: "Nippon Paint", desc: "Thân thiện môi trường" },
  { name: "Mykolor", desc: "Màu sắc rực rỡ nghệ thuật" },
];

export default function BrandPartnersSection() {
  return (
    <section id="partners" className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Đối Tác Phân Phối Sơn Chính Hãng
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mt-8 items-center">
        {BRAND_PARTNERS.map((brand, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all text-center"
          >
            <span className="text-lg font-black text-slate-800 tracking-tight block">
              {brand.name}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              {brand.desc}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
