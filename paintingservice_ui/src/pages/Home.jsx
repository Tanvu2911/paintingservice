import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Paintbrush,
  CalendarPlus,
  ClipboardList,
  History,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Search,
  FileText,
  Hammer,
  Award,
  Layers,
  Home as HomeIcon,
  Droplets,
  Star,
  Building,
} from "lucide-react";
import AxiosConfig from "../util/AxiosConfig";
import NotificationPopover from "../components/layout/NotificationPopover";
import UserMenuDropdown from "../components/layout/UserMenuDropdown";
import { formatMoney } from "../util/formatters";
import { isAdmin, isSurveyStaff, isTechnicianStaff, isCustomer, getRedirectPath } from "../util/roleUtils";

// Icon mapper cho danh sách dịch vụ thực tế
const SERVICE_ICONS = [
  HomeIcon,
  Sparkles,
  ShieldCheck,
  Layers,
  Droplets,
  Building,
  Paintbrush,
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Khảo Sát & Báo Giá Miễn Phí",
    desc: "Kỹ thuật viên có mặt tận nơi sau 30 phút, đo đạc diện tích thực tế và tư vấn chủng loại sơn tối ưu chi phí.",
    Icon: Search,
    highlight: "Miễn phí 100%",
  },
  {
    step: "02",
    title: "Ký Hợp Đồng & Cọc 24 Giờ",
    desc: "Hợp đồng điện tử minh bạch từng mét vuông. Khách chuyển cọc qua VNPay Sandbox để giữ lịch thi công.",
    Icon: FileText,
    highlight: "Hạn cọc 24 giờ",
  },
  {
    step: "03",
    title: "Thi Công Chuẩn 5 Bước",
    desc: "Che chắn đồ đạc cẩn thận, bả bột, sơn lót kháng kiềm và sơn phủ 2 lớp. Giám sát báo cáo tiến độ mỗi ngày.",
    Icon: Hammer,
    highlight: "Che chắn 100%",
  },
  {
    step: "04",
    title: "Nghiệm Thu & Bảo Hành",
    desc: "Khách hàng nghiệm thu từng mét vuông tường, hài lòng mới tất toán. Kích hoạt bảo hành điện tử lên đến 5 năm.",
    Icon: Award,
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
      "Rất ấn tượng với sự chuyên nghiệp của đội ngũ. Che chắn bàn ghế rất kỹ càng, thi công xong dọn dẹp sạch bóng. Màu sơn chuẩn như bản thiết kế 3D.",
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
      "Quy trình báo giá và hợp đồng rất rõ ràng, không có chuyện phát sinh tiền vật tư. Có hợp đồng bảo hành 5 năm nên tôi rất an tâm.",
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
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Tải danh sách dịch vụ thật từ backend API
  useEffect(() => {
    setLoadingServices(true);
    AxiosConfig.get("/services")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải dịch vụ:", err);
      })
      .finally(() => {
        setLoadingServices(false);
      });

    if (user) {
      AxiosConfig.get("/notifications/me")
        .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
  }, [user]);

  // Xử lý đóng user menu khi click bên ngoài
  // (đã được xử lý bên trong UserMenuDropdown component)

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

  // Chuyển hướng khi bấm chọn dịch vụ ngoài Home
  const handleSelectService = (srv) => {
    if (user) {
      navigate("/customer/booking", {
        state: {
          serviceId: srv.id,
          serviceName: srv.name,
        },
      });
    } else {
      navigate("/login", {
        state: {
          redirectTo: "/customer/booking",
          serviceId: srv.id,
          serviceName: srv.name,
        },
      });
    }
  };

  const handleBookingCTA = () => {
    if (user) {
      navigate("/customer/booking");
    } else {
      navigate("/login", {
        state: { redirectTo: "/customer/booking" },
      });
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 antialiased font-sans">
      {/* ─── 1. NAVBAR SÁNG HIỆN ĐẠI (EMERALD THEME) ─────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 px-4 sm:px-8 lg:px-12 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div
            onClick={() => navigate("/home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Paintbrush className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                PAINTING<span className="text-emerald-600">247</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                Dịch vụ sơn nhà chuyên nghiệp
              </p>
            </div>
          </div>

          {/* Menu giữa */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <a href="#services" className="hover:text-emerald-600 transition">
              Dịch vụ
            </a>
            <a href="#workflow" className="hover:text-emerald-600 transition flex items-center gap-1.5">
              <span>Quy trình 24h</span>
            </a>
            <a href="#commitments" className="hover:text-emerald-600 transition">
              Cam kết
            </a>
            <a href="#testimonials" className="hover:text-emerald-600 transition">
              Đánh giá
            </a>
            <a href="#partners" className="hover:text-emerald-600 transition">
              Hãng sơn
            </a>
          </nav>

          {/* User Actions / Auth */}
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                {isCustomer(user) && (
                  <button
                    type="button"
                    onClick={handleBookingCTA}
                    className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <CalendarPlus className="w-4 h-4 text-white" />
                    <span>Đặt lịch khảo sát</span>
                  </button>
                )}

                <NotificationPopover
                  user={user}
                  notifications={notifications}
                  onMarkRead={handleMarkRead}
                  onDeleteAll={handleDeleteAll}
                  onDeleteOne={handleDeleteOne}
                />

                {/* User Dropdown Menu */}
                <UserMenuDropdown
                  profile={user}
                  role={
                    isAdmin(user)
                      ? "admin"
                      : isSurveyStaff(user)
                      ? "survey"
                      : isTechnicianStaff(user)
                      ? "technician"
                      : "customer"
                  }
                  color="emerald"
                  onLogout={onLogout}
                  menuItems={
                    isCustomer(user)
                      ? [
                          { label: "Đặt lịch khảo sát", to: "/customer/booking", icon: <CalendarPlus /> },
                          { label: "Quản lý yêu cầu", to: "/customer/ongoing", icon: <ClipboardList /> },
                          { label: "Lịch sử hoàn thành", to: "/customer/history", icon: <History /> },
                          { label: "Hồ sơ & Địa chỉ", to: "/customer/profile", icon: <User /> },
                        ]
                      : [
                          { label: "Trang quản lý", to: getRedirectPath(user), icon: <User /> },
                        ]
                  }
                />
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Đăng ký
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION TƯƠI SÁNG (EMERALD HERO) ─────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-slate-50 to-white text-slate-900 pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80">
        <div className="relative max-w-5xl mx-auto text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cam kết sơn chính hãng 100% • Khảo sát &amp; Báo giá tận nơi miễn phí</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900">
            Nâng Tầm Không Gian Sống <br className="hidden sm:inline" />
            Bằng <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">Lớp Sơn Hoàn Hảo</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Giải pháp thi công sơn nhà trọn gói uy tín: Hợp đồng điện tử minh bạch,
            thanh toán trực tuyến qua VNPay Sandbox, thợ lành nghề và bảo hành điện tử dài hạn.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleBookingCTA}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-white" />
              <span>Đặt Lịch Khảo Sát Miễn Phí</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <a
              href="#workflow"
              className="px-7 py-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-xs transition-all"
            >
              Xem Quy Trình Làm Việc
            </a>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-200/80 max-w-4xl mx-auto">
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">5.200+</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Công trình hoàn thiện</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">99.8%</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Khách hàng hài lòng</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">VNPay</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Thanh toán tự động</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">5 Năm</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Bảo hành chính hãng</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. DANH SÁCH DỊCH VỤ THỰC TẾ ──────────────────────────────────── */}
      <section id="services" className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Dịch Vụ Của Chúng Tôi
          </span>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
            Hạng Mục Thi Công Sơn Chuyên Nghiệp
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Chọn gói dịch vụ bên dưới để chuyển thẳng sang phần đặt lịch khảo sát đã chọn sẵn.
          </p>
        </div>

        {loadingServices ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-4/5" />
                <div className="h-10 bg-emerald-100 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <Paintbrush className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">Chưa có dịch vụ nào trên hệ thống</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng quay lại sau</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv, index) => {
              const ServiceIcon = SERVICE_ICONS[index % SERVICE_ICONS.length] || Paintbrush;
              return (
                <div
                  key={srv.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ServiceIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-2">
                      {srv.name}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {srv.description || "Dịch vụ sơn chất lượng cao, bền màu và thẩm mỹ vượt trội."}
                    </p>

                    <div className="space-y-1.5 mb-6">
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Vật tư sơn chính hãng 100%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Che chắn nội thất sạch sẽ</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Bảo hành chất lượng công trình</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      Đơn giá cơ sở
                    </div>
                    <div className="text-base font-black text-emerald-700 mb-3">
                      {srv.basePrice ? `${formatMoney(srv.basePrice)} / m²` : "Khảo sát báo giá"}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectService(srv)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Chọn dịch vụ này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── 4. QUY TRÌNH LÀM VIỆC SÁNG NỀN ───────────────────────────────── */}
      <section id="workflow" className="bg-slate-100/70 text-slate-900 py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
              Quy Trình 4 Bước Chuẩn
            </span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 text-slate-900">
              Minh Bạch Từ Khảo Sát Đến Bàn Giao
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Bảo vệ quyền lợi tối đa của khách hàng với hợp đồng điện tử và thanh toán tự động qua VNPay Sandbox.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step) => {
              const StepIcon = step.Icon;
              return (
                <div
                  key={step.step}
                  className="bg-white border border-slate-200 rounded-3xl p-6 relative hover:shadow-md hover:border-emerald-300 transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                    <StepIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="absolute top-5 right-5 text-3xl font-black text-emerald-100">
                    {step.step}
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
                    {step.highlight}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mb-2">{step.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Banner lưu ý */}
          <div className="mt-12 bg-white border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900 text-sm">
                  Thanh toán an toàn qua cổng VNPay Sandbox:
                </h5>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khách hàng nộp cọc 30% và tất toán 70% trực tiếp trên hệ thống để được xác nhận tự động.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBookingCTA}
              className="whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
            >
              Đặt lịch ngay
            </button>
          </div>
        </div>
      </section>

      {/* ─── 5. CAM KẾT CHẤT LƯỢNG ──────────────────────────────────────────── */}
      <section id="commitments" className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
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
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    100% Sơn chính hãng nguyên đai nguyên kiện
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mở thùng sơn trực tiếp trước mặt khách hàng, có tem chống giả điện tử của hãng.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Bọc lót đồ đạc &amp; Vệ sinh sạch sẽ sau thi công
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Che phủ nilon chuyên dụng toàn bộ sàn, đồ gỗ, sofa. Dọn dẹp sạch sẽ trước khi bàn giao.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Bảo hành bong tróc &amp; ố mốc lên đến 5 năm
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bảo hành điện tử theo hợp đồng. Đội ngũ hỗ trợ xử lý yêu cầu nhanh chóng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 text-slate-900 border border-slate-200 relative shadow-sm space-y-6">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Nhận tư vấn nhanh &amp; Báo giá tức thì
            </div>
            <h4 className="text-2xl font-black leading-snug text-slate-900">
              Bạn Cần Sơn Lại Nhà Hay Cải Tạo Căn Hộ?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đặt lịch hẹn để kỹ thuật viên liên hệ tư vấn trực tiếp và khảo sát tận nơi miễn phí ngay hôm nay.
            </p>

            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-100">
                <span className="text-slate-500">Khảo sát &amp; Đo đạc:</span>
                <span className="font-bold text-emerald-800">Miễn phí 100%</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-100">
                <span className="text-slate-500">Hợp đồng điện tử:</span>
                <span className="font-bold text-emerald-800">Minh bạch từng m²</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Thời gian có mặt:</span>
                <span className="font-bold text-emerald-800">Sau 30 - 60 phút</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBookingCTA}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4 text-white" />
              <span>Đặt Lịch Khảo Sát Ngay</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 6. ĐÁNH GIÁ ───────────────────────────────────────────────────── */}
      <section id="testimonials" className="bg-white py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Khách Hàng Nói Gì
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
              Hơn 5.000+ Khách Hàng Đã Tin Tưởng
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Sự hài lòng của quý khách là tiêu chuẩn chất lượng hàng đầu của chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50/80 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                    {[...Array(t.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic mb-6">
                    &ldquo;{t.content}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                  />
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">{t.name}</h5>
                    <p className="text-[11px] text-slate-500">{t.role}</p>
                    <span className="inline-block mt-0.5 text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
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

      {/* ─── 8. FOOTER SÁNG TỐI GIẢN (LIGHT FOOTER) ────────────────────────── */}
      <footer className="bg-white text-slate-600 text-xs py-14 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                <Paintbrush className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-black text-slate-900">
                PAINTING<span className="text-emerald-600">247</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống dịch vụ sơn sửa nhà trọn gói uy tín hàng đầu. Cam kết chất lượng, bảo hành dài hạn và giá thành minh bạch.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-3">Dịch vụ chính</h5>
            <ul className="space-y-2 text-slate-600">
              <li>Sơn cải tạo nhà cũ</li>
              <li>Sơn nhà mới trọn gói</li>
              <li>Chống thấm tường &amp; trần</li>
              <li>Sơn hiệu ứng nghệ thuật</li>
              <li>Sơn sàn công nghiệp</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-3">Chính sách &amp; Hỗ trợ</h5>
            <ul className="space-y-2 text-slate-600">
              <li>Thanh toán trực tuyến VNPay</li>
              <li>Chính sách bảo hành 5 năm</li>
              <li>Quy trình giải quyết khiếu nại</li>
              <li>Bảo mật thông tin khách hàng</li>
              <li>Hướng dẫn thanh toán hợp đồng</li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 text-sm mb-3">Liên hệ hỗ trợ</h5>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Trụ sở: Hà Nội &amp; TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hotline 24/7: 1900.247.xxx</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Email: support@painting247.vn</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Giờ làm việc: 7:30 - 20:30 hàng ngày</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} PAINTING247. Toàn bộ bản quyền được bảo lưu.
          </div>
          <div className="flex gap-4 text-slate-500 font-semibold">
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