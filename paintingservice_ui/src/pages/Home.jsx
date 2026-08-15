// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import AxiosConfig from "../util/AxiosConfig";
// import NotificationPopover from "../components/NotificationPopover";
// import { formatMoney } from "../util/formatters";

// // ─── Dữ liệu mẫu (Mock Fallback) cho Trang Home ────────────────────────────────
// const FEATURED_SERVICES = [
//   {
//     id: 1,
//     name: "Sơn Cải Tạo & Làm Mới Nhà Cũ",
//     desc: "Xử lý triệt để tường ẩm mốc, bong tróc, bả matit mịn màng và sơn 2 lớp phủ tươi sáng như mới.",
//     price: "Từ 35.000đ / m²",
//     icon: "🏠",
//     tag: "Phổ biến nhất",
//     features: ["Xử lý chống ẩm mốc", "Bả matit 2 lớp", "Sơn lót kháng kiềm", "Bảo hành 3 năm"],
//   },
//   {
//     id: 2,
//     name: "Sơn Nhà Mới Trọn Gói",
//     desc: "Thi công sơn tường nhà mới xây dựng đúng tiêu chuẩn kỹ thuật chuẩn 5 bước của nhà sản xuất.",
//     price: "Từ 45.000đ / m²",
//     icon: "✨",
//     tag: "Khuyên dùng",
//     features: ["Xả nhám phẳng mịn", "Sơn lót chuyên dụng", "Sơn phủ 2 lớp màu chuẩn", "Bảo hành 5 năm"],
//   },
//   {
//     id: 3,
//     name: "Chống Thấm Trần & Tường Ngoài",
//     desc: "Giải pháp chống thấm chuyên sâu bằng màng chống thấm cao cấp ngăn ngừa ngấm dột vĩnh viễn.",
//     price: "Từ 65.000đ / m²",
//     icon: "🛡️",
//     tag: "Chống thấm",
//     features: ["Chống thấm ngoại thất", "Chống thấm sàn mái", "Keo chuyên dụng", "Bảo hành 7 năm"],
//   },
//   {
//     id: 4,
//     name: "Sơn Hiệu Ứng & Nghệ Thuật",
//     desc: "Sơn giả bê tông, sơn cát sa mạc, sơn kim loại nghệ thuật tạo điểm nhấn sang trọng cho căn hộ, quán cafe.",
//     price: "Từ 180.000đ / m²",
//     icon: "🎨",
//     tag: "Cao cấp",
//     features: ["Hiệu ứng bê tông / gỉ sét", "Độc đáo cá tính", "Bền màu trên 10 năm", "Thợ tay nghề cao"],
//   },
// ];

// const WORKFLOW_STEPS = [
//   {
//     step: "01",
//     title: "Khảo Sát & Báo Giá Miễn Phí",
//     desc: "Kỹ thuật viên có mặt tận nơi sau 30 phút, đo đạc diện tích thực tế và tư vấn loại sơn tối ưu chi phí.",
//     icon: "🔍",
//     highlight: "Miễn phí 100%",
//   },
//   {
//     step: "02",
//     title: "Ký Hợp Đồng & Cọc 24 Giờ",
//     desc: "Hợp đồng điện tử minh bạch từng mét vuông. Khách quét mã VietQR chuyển cọc trong 24h để giữ lịch thi công.",
//     icon: "📜",
//     highlight: "Hạn cọc 24 giờ",
//   },
//   {
//     step: "03",
//     title: "Thi Công Chuẩn 5 Bước",
//     desc: "Che chắn đồ đạc cẩn thận, bả bột, sơn lót kháng kiềm và sơn phủ 2 lớp. Giám sát gửi báo cáo tiến độ mỗi ngày.",
//     icon: "🏗️",
//     highlight: "Che chắn 100%",
//   },
//   {
//     step: "04",
//     title: "Nghiệm Thu & Bảo Hành",
//     desc: "Khách hàng nghiệm thu từng mét vuông tường, hài lòng mới thanh toán nốt. Kích hoạt bảo hành điện tử lên đến 5 năm.",
//     icon: "✅",
//     highlight: "Bảo hành 5 năm",
//   },
// ];

// const TESTIMONIALS = [
//   {
//     id: 1,
//     name: "Anh Hoàng Minh",
//     role: "Chủ căn hộ Vinhomes Smart City",
//     avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
//     content:
//       "Rất ấn tượng với sự chuyên nghiệp của đội ngũ. Che chắn bàn ghế rất kỹ càng, thi công xong dọn dẹp sạch bóng. Màu sơn Dulux chuẩn như bản thiết kế 3D.",
//     rating: 5,
//     project: "Căn hộ 3PN 95m²",
//   },
//   {
//     id: 2,
//     name: "Chị Thu Thảo",
//     role: "Chủ nhà phố Cầu Giấy, Hà Nội",
//     avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
//     content:
//       "Quy trình báo giá và hợp đồng rất rõ ràng, không có chuyện phát sinh tiền vật tư. Chuyển cọc qua VietQR tiện lợi, có hợp đồng bảo hành 5 năm rất an tâm.",
//     rating: 5,
//     project: "Nhà phố 4 tầng 240m²",
//   },
//   {
//     id: 3,
//     name: "Anh Quốc Bảo",
//     role: "Quản lý chuỗi The Coffee House",
//     avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
//     content:
//       "Bên mình đặt sơn hiệu ứng bê tông cho 2 chi nhánh, đội thợ làm việc cả ban đêm để kịp tiến độ khai trương. Tay nghề thợ rất cao và nhiệt tình.",
//     rating: 5,
//     project: "Sơn hiệu ứng 350m²",
//   },
// ];

// const BRAND_PARTNERS = [
//   { name: "Dulux", desc: "Sơn nội & ngoại thất cao cấp" },
//   { name: "Jotun", desc: "Bảo vệ tối ưu chống bám bẩn" },
//   { name: "Kova", desc: "Chuyên gia chống thấm nhiệt đới" },
//   { name: "Nippon Paint", desc: "Thân thiện môi trường" },
//   { name: "Mykolor", desc: "Màu sắc rực rỡ nghệ thuật" },
// ];

// export default function Home({ user, onLogout, showToast }) {
//   const navigate = useNavigate();
//   const [notifications, setNotifications] = useState([]);
//   const [services, setServices] = useState(FEATURED_SERVICES);

//   useEffect(() => {
//     // Tải dịch vụ từ backend nếu có
//     AxiosConfig.get("/services")
//       .then((res) => {
//         if (Array.isArray(res.data) && res.data.length > 0) {
//           // Merge hoặc dùng dữ liệu từ API
//           setServices(res.data);
//         }
//       })
//       .catch(() => {});

//     if (user) {
//       AxiosConfig.get("/notifications/me")
//         .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
//         .catch(() => {});
//     }
//   }, [user]);

//   const handleMarkRead = async () => {
//     if (notifications.some((n) => !n.isRead)) {
//       try {
//         await AxiosConfig.put("/notifications/me/read");
//         setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   };

//   const handleDeleteAll = async () => {
//     if (!notifications.length) return;
//     if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) return;
//     try {
//       await AxiosConfig.delete("/notifications/me");
//       setNotifications([]);
//       showToast?.("Đã xóa tất cả thông báo");
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const handleDeleteOne = async (id) => {
//     try {
//       await AxiosConfig.delete(`/notifications/me/${id}`);
//       setNotifications((prev) => prev.filter((n) => n.id !== id));
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   return (
//     <div className="bg-slate-50 min-h-screen text-slate-800 antialiased font-sans">
//       {/* ─── 1. NAVBAR HIỆN ĐẠI ────────────────────────────────────────────── */}
//       <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 px-4 sm:px-8 lg:px-12 py-3.5 flex justify-between items-center shadow-sm">
//         <div
//           onClick={() => navigate("/home")}
//           className="flex items-center gap-2.5 cursor-pointer group"
//         >
//           <div className="w-10 h-10 bg-gradient-to-tr from-slate-900 via-blue-900 to-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md shadow-blue-900/20">
//             🎨
//           </div>
//           <div>
//             <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
//               PAINTING<span className="text-blue-600">247</span>
//             </h1>
//             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
//               Dịch vụ sơn nhà trọn gói
//             </p>
//           </div>
//         </div>

//         {/* Menu giữa */}
//         <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
//           <a href="#services" className="hover:text-blue-600 transition">
//             Dịch vụ
//           </a>
//           <a href="#workflow" className="hover:text-blue-600 transition flex items-center gap-1">
//             <span>Quy trình 24h</span>
//             <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold rounded-full">
//               Mới
//             </span>
//           </a>
//           <a href="#commitments" className="hover:text-blue-600 transition">
//             Cam kết
//           </a>
//           <a href="#testimonials" className="hover:text-blue-600 transition">
//             Đánh giá
//           </a>
//           <a href="#partners" className="hover:text-blue-600 transition">
//             Hãng sơn
//           </a>
//         </nav>

//         {/* User / CTA phải */}
//         <div>
//           {user ? (
//             <div className="flex items-center gap-3">
//               <NotificationPopover
//                 notifications={notifications}
//                 onMarkRead={handleMarkRead}
//                 onDeleteAll={handleDeleteAll}
//                 onDeleteOne={handleDeleteOne}
//                 color="blue"
//               />
//               <div className="hidden sm:block text-right">
//                 <div className="text-[11px] text-slate-400">Xin chào,</div>
//                 <div className="text-xs font-bold text-slate-800">
//                   {user.username || user.email}
//                 </div>
//               </div>
//               <button
//                 type="button"
//                 onClick={() =>
//                   navigate(
//                     user.role === "ROLE_ADMIN" || user.role === "ADMIN"
//                       ? "/admin/dashboard"
//                       : "/customer/dashboard"
//                   )
//                 }
//                 className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
//               >
//                 Dashboard
//               </button>
//               <button
//                 type="button"
//                 onClick={onLogout}
//                 className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
//               >
//                 Đăng xuất
//               </button>
//             </div>
//           ) : (
//             <div className="flex items-center gap-2.5">
//               <button
//                 type="button"
//                 onClick={() => navigate("/login")}
//                 className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
//               >
//                 Đăng nhập
//               </button>
//               <button
//                 type="button"
//                 onClick={() => navigate("/register")}
//                 className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition"
//               >
//                 Đăng ký ngay
//               </button>
//             </div>
//           )}
//         </div>
//       </header>

//       {/* ─── 2. HERO SECTION ĐẲNG CẤP ──────────────────────────────────────── */}
//       <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
//         {/* Decorative lighting background */}
//         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
//           <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
//           <div className="absolute top-20 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
//         </div>

//         <div className="relative max-w-5xl mx-auto text-center space-y-7">
//           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/15 backdrop-blur-md text-blue-200 shadow-inner">
//             <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
//             <span>Cam kết sơn chính hãng 100% • Khảo sát &amp; Báo giá miễn phí 24/7</span>
//           </div>

//           <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
//             Nâng Tầm Không Gian Sống <br className="hidden sm:inline" />
//             Bằng <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Lớp Sơn Hoàn Hảo</span>
//           </h2>

//           <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
//             Giải pháp thi công sơn nhà trọn gói uy tín: Hợp đồng điện tử minh bạch, chuyển cọc quét mã VietQR trong 24 giờ, thợ lành nghề trên 5 năm kinh nghiệm và bảo hành lên tới 5 năm.
//           </p>

//           {/* CTA Buttons */}
//           <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
//             <button
//               type="button"
//               onClick={() => navigate(user ? "/customer/booking" : "/login")}
//               className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
//             >
//               <span>📋 Đặt Lịch Khảo Sát Miễn Phí</span>
//               <span>→</span>
//             </button>
//             <a
//               href="#workflow"
//               className="px-7 py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-2xl border border-white/20 backdrop-blur-sm transition-all"
//             >
//               📜 Xem Quy Trình Làm Việc
//             </a>
//           </div>

//           {/* Quick Metrics Banner */}
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-white/10 max-w-4xl mx-auto">
//             <div className="p-3">
//               <div className="text-2xl sm:text-3xl font-black text-amber-400">5.200+</div>
//               <div className="text-xs text-slate-300 mt-1 font-medium">Công trình hoàn thiện</div>
//             </div>
//             <div className="p-3">
//               <div className="text-2xl sm:text-3xl font-black text-blue-400">99.8%</div>
//               <div className="text-xs text-slate-300 mt-1 font-medium">Khách hàng hài lòng</div>
//             </div>
//             <div className="p-3">
//               <div className="text-2xl sm:text-3xl font-black text-teal-400">24 Giờ</div>
//               <div className="text-xs text-slate-300 mt-1 font-medium">Xác nhận cọc &amp; giữ lịch</div>
//             </div>
//             <div className="p-3">
//               <div className="text-2xl sm:text-3xl font-black text-rose-400">5 Năm</div>
//               <div className="text-xs text-slate-300 mt-1 font-medium">Bảo hành màu &amp; bong tróc</div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ─── 3. DỊCH VỤ NỔI BẬT ────────────────────────────────────────────── */}
//       <section id="services" className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
//         <div className="text-center max-w-2xl mx-auto mb-14">
//           <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
//             Dịch Vụ Của Chúng Tôi
//           </span>
//           <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
//             Hạng Mục Thi Công Sơn Chuyên Nghiệp
//           </h3>
//           <p className="text-sm text-slate-500 mt-2">
//             Áp dụng công nghệ lăn sơn hiện đại, không bụi bặm, che chắn nội thất 100%.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {services.slice(0, 4).map((srv) => (
//             <div
//               key={srv.id}
//               className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
//             >
//               <div>
//                 <div className="w-14 h-14 bg-gradient-to-tr from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
//                   {srv.icon || "🎨"}
//                 </div>
//                 <h4 className="font-black text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors">
//                   {srv.name}
//                 </h4>
//                 <p className="text-xs text-slate-500 leading-relaxed mb-4">
//                   {srv.desc || srv.description || "Dịch vụ sơn chất lượng cao, bền màu và thẩm mỹ vượt trội."}
//                 </p>

//                 {/* Features */}
//                 <div className="space-y-1.5 mb-6">
//                   {(srv.features || ["Vật tư chính hãng", "Thợ chuyên nghiệp", "Bảo hành dài hạn"]).map(
//                     (f, idx) => (
//                       <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
//                         <span className="text-emerald-500 font-bold">✓</span>
//                         <span>{f}</span>
//                       </div>
//                     )
//                   )}
//                 </div>
//               </div>

//               <div className="pt-4 border-t border-slate-100">
//                 <div className="text-[11px] text-slate-400 font-bold uppercase">Chi phí dự kiến</div>
//                 <div className="text-sm font-black text-rose-600 mb-3">
//                   {srv.price || (srv.basePrice ? `${formatMoney(srv.basePrice)} / m²` : "Báo giá khảo sát")}
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => navigate(user ? "/customer/booking" : "/login")}
//                   className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
//                 >
//                   Chọn dịch vụ này
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* ─── 4. QUY TRÌNH LÀM VIỆC 4 BƯỚC (NỔI BẬT HẠN CỌC 24H) ─────────── */}
//       <section id="workflow" className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center max-w-2xl mx-auto mb-16">
//             <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
//               Quy Trình 4 Bước Chuẩn
//             </span>
//             <h3 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
//               Minh Bạch Từ Khảo Sát Đến Bàn Giao
//             </h3>
//             <p className="text-sm text-slate-400 mt-2">
//               Bảo vệ quyền lợi tối đa của khách hàng với hợp đồng điện tử và thời hạn cọc rõ ràng.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {WORKFLOW_STEPS.map((step) => (
//               <div
//                 key={step.step}
//                 className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 relative hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-1"
//               >
//                 <div className="text-4xl mb-4">{step.icon}</div>
//                 <span className="absolute top-5 right-5 text-4xl font-black text-slate-700">
//                   {step.step}
//                 </span>
//                 <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
//                   {step.highlight}
//                 </span>
//                 <h4 className="font-bold text-white text-base mb-2">{step.title}</h4>
//                 <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
//               </div>
//             ))}
//           </div>

//           {/* Banner lưu ý thời hạn cọc */}
//           <div className="mt-12 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
//             <div className="flex items-center gap-3">
//               <span className="text-3xl">⏱️</span>
//               <div>
//                 <h5 className="font-bold text-amber-300 text-sm">
//                   Lưu ý quan trọng về thời hạn nộp cọc 24 giờ:
//                 </h5>
//                 <p className="text-xs text-slate-300 mt-0.5">
//                   Sau khi ký hợp đồng, quý khách vui lòng quét mã VietQR chuyển tiền cọc trong vòng 24h. Quá 24h đơn hàng sẽ tự động hủy để nhường lịch thợ cho khách hàng khác.
//                 </p>
//               </div>
//             </div>
//             <button
//               type="button"
//               onClick={() => navigate(user ? "/customer/booking" : "/login")}
//               className="whitespace-nowrap px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow-lg"
//             >
//               Đặt lịch ngay
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* ─── 5. CAM KẾT CHẤT LƯỢNG ─────────────────────────────────────────── */}
//       <section id="commitments" className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//           <div className="space-y-6">
//             <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
//               Tại Sao Chọn Chúng Tôi
//             </span>
//             <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
//               Cam Kết Vàng Cho Mọi <br /> Công Trình Sơn Nhà
//             </h3>
//             <p className="text-sm text-slate-600 leading-relaxed">
//               Chúng tôi hiểu ngôi nhà là tổ ấm quý giá nhất. Vì vậy mỗi công trình đều được giám sát chặt chẽ, sử dụng vật tư loại 1 và được thực hiện bởi đội thợ chuyên nghiệp.
//             </p>

//             <div className="space-y-4">
//               <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
//                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
//                   🛡️
//                 </div>
//                 <div>
//                   <h4 className="font-bold text-slate-800 text-sm">100% Sơn chính hãng nguyên đai nguyên kiện</h4>
//                   <p className="text-xs text-slate-500 mt-0.5">
//                     Mở thùng sơn trực tiếp trước mặt khách hàng, có tem chống giả điện tử của hãng.
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
//                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
//                   🧹
//                 </div>
//                 <div>
//                   <h4 className="font-bold text-slate-800 text-sm">Bọc lót đồ đạc &amp; Vệ sinh sạch sẽ sau thi công</h4>
//                   <p className="text-xs text-slate-500 mt-0.5">
//                     Che phủ nilon chuyên dụng toàn bộ sàn, đồ gỗ, sofa. Lau dọn sạch sẽ trước khi bàn giao.
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
//                 <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
//                   💎
//                 </div>
//                 <div>
//                   <h4 className="font-bold text-slate-800 text-sm">Bảo hành bong tróc &amp; ố mốc lên đến 5 năm</h4>
//                   <p className="text-xs text-slate-500 mt-0.5">
//                     Bảo hành điện tử qua số điện thoại. Đội bảo hành xử lý sự cố trong vòng 24 giờ.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative shadow-2xl space-y-6">
//             <div className="text-xs font-bold uppercase tracking-widest text-blue-200">
//               Nhận tư vấn nhanh &amp; Báo giá tức thì
//             </div>
//             <h4 className="text-2xl font-black leading-snug">
//               Bạn Cần Sơn Lại Nhà Đón Tết Hay Cải Tạo Căn Hộ?
//             </h4>
//             <p className="text-xs text-blue-100 leading-relaxed">
//               Điền thông tin để kỹ thuật viên liên hệ tư vấn phối màu sơn 3D theo phong thủy miễn phí ngay hôm nay.
//             </p>

//             <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3">
//               <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20">
//                 <span>Ưu đãi tuần này:</span>
//                 <span className="font-black text-amber-300">Giảm 10% công thợ</span>
//               </div>
//               <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20">
//                 <span>Khảo sát &amp; Đo đạc:</span>
//                 <span className="font-bold text-emerald-300">Miễn phí 100%</span>
//               </div>
//               <div className="flex items-center justify-between text-xs">
//                 <span>Thời gian có mặt:</span>
//                 <span className="font-bold text-white">Sau 30 - 60 phút</span>
//               </div>
//             </div>

//             <button
//               type="button"
//               onClick={() => navigate(user ? "/customer/booking" : "/login")}
//               className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition cursor-pointer"
//             >
//               📋 Đặt Lịch Khảo Sát Ngay Hôm Nay
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* ─── 6. ĐÁNH GIÁ KHÁCH HÀNG ────────────────────────────────────────── */}
//       <section id="testimonials" className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center max-w-2xl mx-auto mb-14">
//             <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
//               Khách Hàng Nói Gì
//             </span>
//             <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
//               Hơn 5.000+ Khách Hàng Đã Tin Tưởng
//             </h3>
//             <p className="text-sm text-slate-500 mt-2">
//               Sự hài lòng của quý khách là niềm tự hào lớn nhất của chúng tôi.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {TESTIMONIALS.map((t) => (
//               <div
//                 key={t.id}
//                 className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all"
//               >
//                 <div>
//                   <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
//                     {"★".repeat(t.rating)}
//                   </div>
//                   <p className="text-xs text-slate-700 leading-relaxed italic mb-6">
//                     &ldquo;{t.content}&rdquo;
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
//                   <img
//                     src={t.avatar}
//                     alt={t.name}
//                     className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
//                   />
//                   <div>
//                     <h5 className="font-bold text-slate-900 text-xs">{t.name}</h5>
//                     <p className="text-[11px] text-slate-500">{t.role}</p>
//                     <span className="inline-block mt-0.5 text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded">
//                       {t.project}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ─── 7. ĐỐI TÁC HÃNG SƠN ────────────────────────────────────────────── */}
//       <section id="partners" className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
//         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
//           Đối Tác Phân Phối Sơn Chính Hãng
//         </span>
//         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mt-8 items-center">
//           {BRAND_PARTNERS.map((brand, idx) => (
//             <div
//               key={idx}
//               className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
//             >
//               <span className="text-lg font-black text-slate-800 tracking-tight block">
//                 {brand.name}
//               </span>
//               <span className="text-[11px] text-slate-400 block mt-1">
//                 {brand.desc}
//               </span>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* ─── 8. FOOTER CHUYÊN NGHIỆP ──────────────────────────────────────── */}
//       <footer className="bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-800">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
//           <div className="space-y-3">
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
//                 🎨
//               </div>
//               <span className="text-base font-black text-white">PAINTING247</span>
//             </div>
//             <p className="text-xs text-slate-400 leading-relaxed">
//               Hệ thống dịch vụ sơn sửa nhà trọn gói uy tín hàng đầu. Cam kết chất lượng, bảo hành dài hạn và giá thành minh bạch.
//             </p>
//           </div>

//           <div>
//             <h5 className="font-bold text-white text-sm mb-3">Dịch vụ chính</h5>
//             <ul className="space-y-2">
//               <li>Sơn cải tạo nhà cũ</li>
//               <li>Sơn nhà mới trọn gói</li>
//               <li>Chống thấm tường &amp; trần</li>
//               <li>Sơn hiệu ứng bê tông</li>
//               <li>Sơn sàn epoxy công nghiệp</li>
//             </ul>
//           </div>

//           <div>
//             <h5 className="font-bold text-white text-sm mb-3">Chính sách &amp; Hỗ trợ</h5>
//             <ul className="space-y-2">
//               <li>Quy định nộp cọc trong 24h</li>
//               <li>Chính sách bảo hành 5 năm</li>
//               <li>Quy trình giải quyết khiếu nại</li>
//               <li>Bảo mật thông tin khách hàng</li>
//               <li>Hướng dẫn thanh toán VietQR</li>
//             </ul>
//           </div>

//           <div>
//             <h5 className="font-bold text-white text-sm mb-3">Liên hệ hỗ trợ</h5>
//             <ul className="space-y-2 text-slate-300">
//               <li>📍 Trụ sở: Hà Nội &amp; TP. Hồ Chí Minh</li>
//               <li>📞 Hotline 24/7: 1900.247.xxx</li>
//               <li>✉️ Email: support@painting247.vn</li>
//               <li>⏰ Giờ làm việc: 7:30 - 20:30 hàng ngày</li>
//             </ul>
//           </div>
//         </div>

//         <div className="max-w-6xl mx-auto px-4 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500">
//           <div>&copy; {new Date().getFullYear()} PAINTING247. Toàn bộ bản quyền được bảo lưu.</div>
//           <div className="flex gap-4 text-slate-400">
//             <span>Chất Lượng</span>
//             <span>•</span>
//             <span>Tận Tâm</span>
//             <span>•</span>
//             <span>Đúng Hẹn</span>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }




import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AxiosConfig from "../util/AxiosConfig";
import NotificationPopover from "../components/NotificationPopover";
import { formatMoney } from "../util/formatters";
import RoleQuickNav from "../components/home/RoleQuickNav";

// ─── Dữ liệu mẫu (Mock Fallback) cho Trang Home ────────────────────────────────
const FEATURED_SERVICES = [
  {
    id: 1,
    name: "Sơn Cải Tạo & Làm Mới Nhà Cũ",
    desc: "Xử lý triệt để tường ẩm mốc, bong tróc, bả matit mịn màng và sơn 2 lớp phủ tươi sáng như mới.",
    price: "Từ 35.000đ / m²",
    icon: "🏠",
    tag: "Phổ biến nhất",
    features: ["Xử lý chống ẩm mốc", "Bả matit 2 lớp", "Sơn lót kháng kiềm", "Bảo hành 3 năm"],
  },
  {
    id: 2,
    name: "Sơn Nhà Mới Trọn Gói",
    desc: "Thi công sơn tường nhà mới xây dựng đúng tiêu chuẩn kỹ thuật chuẩn 5 bước của nhà sản xuất.",
    price: "Từ 45.000đ / m²",
    icon: "✨",
    tag: "Khuyên dùng",
    features: ["Xả nhám phẳng mịn", "Sơn lót chuyên dụng", "Sơn phủ 2 lớp màu chuẩn", "Bảo hành 5 năm"],
  },
  {
    id: 3,
    name: "Chống Thấm Trần & Tường Ngoài",
    desc: "Giải pháp chống thấm chuyên sâu bằng màng chống thấm cao cấp ngăn ngừa ngấm dột vĩnh viễn.",
    price: "Từ 65.000đ / m²",
    icon: "🛡️",
    tag: "Chống thấm",
    features: ["Chống thấm ngoại thất", "Chống thấm sàn mái", "Keo chuyên dụng", "Bảo hành 7 năm"],
  },
  {
    id: 4,
    name: "Sơn Hiệu Ứng & Nghệ Thuật",
    desc: "Sơn giả bê tông, sơn cát sa mạc, sơn kim loại nghệ thuật tạo điểm nhấn sang trọng cho căn hộ, quán cafe.",
    price: "Từ 180.000đ / m²",
    icon: "🎨",
    tag: "Cao cấp",
    features: ["Hiệu ứng bê tông / gỉ sét", "Độc đáo cá tính", "Bền màu trên 10 năm", "Thợ tay nghề cao"],
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Khảo Sát & Báo Giá Miễn Phí",
    desc: "Kỹ thuật viên có mặt tận nơi sau 30 phút, đo đạc diện tích thực tế và tư vấn loại sơn tối ưu chi phí.",
    icon: "🔍",
    highlight: "Miễn phí 100%",
  },
  {
    step: "02",
    title: "Ký Hợp Đồng & Cọc 24 Giờ",
    desc: "Hợp đồng điện tử minh bạch từng mét vuông. Khách quét mã VietQR chuyển cọc trong 24h để giữ lịch thi công.",
    icon: "📜",
    highlight: "Hạn cọc 24 giờ",
  },
  {
    step: "03",
    title: "Thi Công Chuẩn 5 Bước",
    desc: "Che chắn đồ đạc cẩn thận, bả bột, sơn lót kháng kiềm và sơn phủ 2 lớp. Giám sát gửi báo cáo tiến độ mỗi ngày.",
    icon: "🏗️",
    highlight: "Che chắn 100%",
  },
  {
    step: "04",
    title: "Nghiệm Thu & Bảo Hành",
    desc: "Khách hàng nghiệm thu từng mét vuông tường, hài lòng mới thanh toán nốt. Kích hoạt bảo hành điện tử lên đến 5 năm.",
    icon: "✅",
    highlight: "Bảo hành 5 năm",
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Anh Hoàng Minh",
    role: "Chủ căn hộ Vinhomes Smart City",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    content:
      "Rất ấn tượng với sự chuyên nghiệp của đội ngũ. Che chắn bàn ghế rất kỹ càng, thi công xong dọn dẹp sạch bóng. Màu sơn Dulux chuẩn như bản thiết kế 3D.",
    rating: 5,
    project: "Căn hộ 3PN 95m²",
  },
  {
    id: 2,
    name: "Chị Thu Thảo",
    role: "Chủ nhà phố Cầu Giấy, Hà Nội",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    content:
      "Quy trình báo giá và hợp đồng rất rõ ràng, không có chuyện phát sinh tiền vật tư. Chuyển cọc qua VietQR tiện lợi, có hợp đồng bảo hành 5 năm rất an tâm.",
    rating: 5,
    project: "Nhà phố 4 tầng 240m²",
  },
  {
    id: 3,
    name: "Anh Quốc Bảo",
    role: "Quản lý chuỗi The Coffee House",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    content:
      "Bên mình đặt sơn hiệu ứng bê tông cho 2 chi nhánh, đội thợ làm việc cả ban đêm để kịp tiến độ khai trương. Tay nghề thợ rất cao và nhiệt tình.",
    rating: 5,
    project: "Sơn hiệu ứng 350m²",
  },
];

const BRAND_PARTNERS = [
  { name: "Dulux", desc: "Sơn nội & ngoại thất cao cấp" },
  { name: "Jotun", desc: "Bảo vệ tối ưu chống bám bẩn" },
  { name: "Kova", desc: "Chuyên gia chống thấm nhiệt đới" },
  { name: "Nippon Paint", desc: "Thân thiện môi trường" },
  { name: "Mykolor", desc: "Màu sắc rực rỡ nghệ thuật" },
];

export default function Home({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [services, setServices] = useState(FEATURED_SERVICES);

  useEffect(() => {
    AxiosConfig.get("/services")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data);
        }
      })
      .catch(() => { });

    if (user) {
      AxiosConfig.get("/notifications/me")
        .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
        .catch(() => { });
    }
  }, [user]);

  const handleMarkRead = async () => {
    if (notifications.some((n) => !n.isRead)) {
      try {
        await AxiosConfig.put("/notifications/me/read");
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!notifications.length) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) return;
    try {
      await AxiosConfig.delete("/notifications/me");
      setNotifications([]);
      showToast?.("Đã xóa tất cả thông báo");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOne = async (id) => {
    try {
      await AxiosConfig.delete(`/notifications/me/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 antialiased font-sans">
      {/* ─── 1. NAVBAR ─────────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 px-4 sm:px-8 lg:px-12 py-3.5 flex justify-between items-center shadow-sm">
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-slate-900 via-blue-900 to-blue-600 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md shadow-blue-900/20">
            🎨
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
              PAINTING<span className="text-blue-600">247</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Dịch vụ sơn nhà trọn gói
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
          <a href="#services" className="hover:text-blue-600 transition">
            Dịch vụ
          </a>
          <a
            href="#workflow"
            className="hover:text-blue-600 transition flex items-center gap-1"
          >
            <span>Quy trình 24h</span>
            <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold rounded-full">
              Mới
            </span>
          </a>
          <a href="#commitments" className="hover:text-blue-600 transition">
            Cam kết
          </a>
          <a href="#testimonials" className="hover:text-blue-600 transition">
            Đánh giá
          </a>
          <a href="#partners" className="hover:text-blue-600 transition">
            Hãng sơn
          </a>
        </nav>

        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationPopover
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onDeleteAll={handleDeleteAll}
                onDeleteOne={handleDeleteOne}
                color="blue"
              />
              <div className="hidden sm:block text-right">
                <div className="text-[11px] text-slate-400">Xin chào,</div>
                <div className="text-xs font-bold text-slate-800">
                  {user.username || user.email}
                </div>
              </div>
              {/* <button
                type="button"
                onClick={() =>
                  navigate(
                    user.role === "ROLE_ADMIN" || user.role === "ADMIN"
                      ? "/admin/dashboard"
                      : "/customer/dashboard"
                  )
                }
                className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
              >
                Dashboard
              </button> */}
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition"
              >
                Đăng ký ngay
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── ROLE QUICK NAV (chỉ hiện khi đã login, gọn) ─────────────────── */}
      {user && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RoleQuickNav user={user} compact />
          </div>
        </div>
      )}

      {/* ─── 2. HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/15 backdrop-blur-md text-blue-200 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Cam kết sơn chính hãng 100% • Khảo sát &amp; Báo giá miễn phí 24/7
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            Nâng Tầm Không Gian Sống <br className="hidden sm:inline" />
            Bằng{" "}
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Lớp Sơn Hoàn Hảo
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Giải pháp thi công sơn nhà trọn gói uy tín: Hợp đồng điện tử minh
            bạch, chuyển cọc quét mã VietQR trong 24 giờ, thợ lành nghề trên 5
            năm kinh nghiệm và bảo hành lên tới 5 năm.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate(user ? "/customer/booking" : "/login")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
            >
              <span>📋 Đặt Lịch Khảo Sát Miễn Phí</span>
              <span>→</span>
            </button>
            <a
              href="#workflow"
              className="px-7 py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-2xl border border-white/20 backdrop-blur-sm transition-all"
            >
              📜 Xem Quy Trình Làm Việc
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-white/10 max-w-4xl mx-auto">
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">
                5.200+
              </div>
              <div className="text-xs text-slate-300 mt-1 font-medium">
                Công trình hoàn thiện
              </div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-blue-400">
                99.8%
              </div>
              <div className="text-xs text-slate-300 mt-1 font-medium">
                Khách hàng hài lòng
              </div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-teal-400">
                24 Giờ
              </div>
              <div className="text-xs text-slate-300 mt-1 font-medium">
                Xác nhận cọc &amp; giữ lịch
              </div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-rose-400">
                5 Năm
              </div>
              <div className="text-xs text-slate-300 mt-1 font-medium">
                Bảo hành màu &amp; bong tróc
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. DỊCH VỤ ────────────────────────────────────────────────────── */}
      <section
        id="services"
        className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Dịch Vụ Của Chúng Tôi
          </span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
            Hạng Mục Thi Công Sơn Chuyên Nghiệp
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Áp dụng công nghệ lăn sơn hiện đại, không bụi bặm, che chắn nội thất
            100%.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 4).map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 bg-gradient-to-tr from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">
                  {srv.icon || "🎨"}
                </div>
                <h4 className="font-black text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors">
                  {srv.name}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {srv.desc ||
                    srv.description ||
                    "Dịch vụ sơn chất lượng cao, bền màu và thẩm mỹ vượt trội."}
                </p>

                <div className="space-y-1.5 mb-6">
                  {(
                    srv.features || [
                      "Vật tư chính hãng",
                      "Thợ chuyên nghiệp",
                      "Bảo hành dài hạn",
                    ]
                  ).map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-700"
                    >
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 font-bold uppercase">
                  Chi phí dự kiến
                </div>
                <div className="text-sm font-black text-rose-600 mb-3">
                  {srv.price ||
                    (srv.basePrice
                      ? `${formatMoney(srv.basePrice)} / m²`
                      : "Báo giá khảo sát")}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(user ? "/customer/booking" : "/login")
                  }
                  className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Chọn dịch vụ này
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. QUY TRÌNH ──────────────────────────────────────────────────── */}
      <section
        id="workflow"
        className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Quy Trình 4 Bước Chuẩn
            </span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
              Minh Bạch Từ Khảo Sát Đến Bàn Giao
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Bảo vệ quyền lợi tối đa của khách hàng với hợp đồng điện tử và
              thời hạn cọc rõ ràng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.step}
                className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 relative hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <span className="absolute top-5 right-5 text-4xl font-black text-slate-700">
                  {step.step}
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
                  {step.highlight}
                </span>
                <h4 className="font-bold text-white text-base mb-2">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏱️</span>
              <div>
                <h5 className="font-bold text-amber-300 text-sm">
                  Lưu ý quan trọng về thời hạn nộp cọc 24 giờ:
                </h5>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sau khi ký hợp đồng, quý khách vui lòng quét mã VietQR chuyển
                  tiền cọc trong vòng 24h. Quá 24h đơn hàng sẽ tự động hủy để
                  nhường lịch thợ cho khách hàng khác.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(user ? "/customer/booking" : "/login")}
              className="whitespace-nowrap px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow-lg"
            >
              Đặt lịch ngay
            </button>
          </div>
        </div>
      </section>

      {/* ─── 5. CAM KẾT ────────────────────────────────────────────────────── */}
      <section
        id="commitments"
        className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Tại Sao Chọn Chúng Tôi
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
              Cam Kết Vàng Cho Mọi <br /> Công Trình Sơn Nhà
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Chúng tôi hiểu ngôi nhà là tổ ấm quý giá nhất. Vì vậy mỗi công
              trình đều được giám sát chặt chẽ, sử dụng vật tư loại 1 và được
              thực hiện bởi đội thợ chuyên nghiệp.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  🛡️
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    100% Sơn chính hãng nguyên đai nguyên kiện
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mở thùng sơn trực tiếp trước mặt khách hàng, có tem chống
                    giả điện tử của hãng.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  🧹
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Bọc lót đồ đạc &amp; Vệ sinh sạch sẽ sau thi công
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Che phủ nilon chuyên dụng toàn bộ sàn, đồ gỗ, sofa. Lau dọn
                    sạch sẽ trước khi bàn giao.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  💎
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Bảo hành bong tróc &amp; ố mốc lên đến 5 năm
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bảo hành điện tử qua số điện thoại. Đội bảo hành xử lý sự
                    cố trong vòng 24 giờ.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative shadow-2xl space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Nhận tư vấn nhanh &amp; Báo giá tức thì
            </div>
            <h4 className="text-2xl font-black leading-snug">
              Bạn Cần Sơn Lại Nhà Đón Tết Hay Cải Tạo Căn Hộ?
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed">
              Điền thông tin để kỹ thuật viên liên hệ tư vấn phối màu sơn 3D
              theo phong thủy miễn phí ngay hôm nay.
            </p>

            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20">
                <span>Ưu đãi tuần này:</span>
                <span className="font-black text-amber-300">
                  Giảm 10% công thợ
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/20">
                <span>Khảo sát &amp; Đo đạc:</span>
                <span className="font-bold text-emerald-300">Miễn phí 100%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Thời gian có mặt:</span>
                <span className="font-bold text-white">Sau 30 - 60 phút</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(user ? "/customer/booking" : "/login")}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition cursor-pointer"
            >
              📋 Đặt Lịch Khảo Sát Ngay Hôm Nay
            </button>
          </div>
        </div>
      </section>

      {/* ─── 6. ĐÁNH GIÁ ───────────────────────────────────────────────────── */}
      <section
        id="testimonials"
        className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Khách Hàng Nói Gì
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
              Hơn 5.000+ Khách Hàng Đã Tin Tưởng
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Sự hài lòng của quý khách là niềm tự hào lớn nhất của chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic mb-6">
                    &ldquo;{t.content}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      {t.name}
                    </h5>
                    <p className="text-[11px] text-slate-500">{t.role}</p>
                    <span className="inline-block mt-0.5 text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded">
                      {t.project}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. ĐỐI TÁC ────────────────────────────────────────────────────── */}
      <section
        id="partners"
        className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center"
      >
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Đối Tác Phân Phối Sơn Chính Hãng
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mt-8 items-center">
          {BRAND_PARTNERS.map((brand, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
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

      {/* ─── 8. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                🎨
              </div>
              <span className="text-base font-black text-white">
                PAINTING247
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hệ thống dịch vụ sơn sửa nhà trọn gói uy tín hàng đầu. Cam kết
              chất lượng, bảo hành dài hạn và giá thành minh bạch.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-white text-sm mb-3">Dịch vụ chính</h5>
            <ul className="space-y-2">
              <li>Sơn cải tạo nhà cũ</li>
              <li>Sơn nhà mới trọn gói</li>
              <li>Chống thấm tường &amp; trần</li>
              <li>Sơn hiệu ứng bê tông</li>
              <li>Sơn sàn epoxy công nghiệp</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-sm mb-3">
              Chính sách &amp; Hỗ trợ
            </h5>
            <ul className="space-y-2">
              <li>Quy định nộp cọc trong 24h</li>
              <li>Chính sách bảo hành 5 năm</li>
              <li>Quy trình giải quyết khiếu nại</li>
              <li>Bảo mật thông tin khách hàng</li>
              <li>Hướng dẫn thanh toán VietQR</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-sm mb-3">Liên hệ hỗ trợ</h5>
            <ul className="space-y-2 text-slate-300">
              <li>📍 Trụ sở: Hà Nội &amp; TP. Hồ Chí Minh</li>
              <li>📞 Hotline 24/7: 1900.247.xxx</li>
              <li>✉️ Email: support@painting247.vn</li>
              <li>⏰ Giờ làm việc: 7:30 - 20:30 hàng ngày</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} PAINTING247. Toàn bộ bản quyền
            được bảo lưu.
          </div>
          <div className="flex gap-4 text-slate-400">
            <span>Chất Lượng</span>
            <span>•</span>
            <span>Tận Tâm</span>
            <span>•</span>
            <span>Đúng Hẹn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}