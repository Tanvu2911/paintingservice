import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  ClipboardList,
  Paintbrush,
  Info,
  User,
  Star,
  Sparkles,
  Map,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AddressMapModal from "../../components/common/AddressMapModal";
import {
  HANOI_DISTRICTS,
  TIME_SLOT_GROUPS,
  parseHanoiAddress,
  formatHanoiAddress,
  cleanStreetAddress,
} from "../../data/hanoiLocations";

function formatTime(timeInput) {
  if (!timeInput) return "08:00:00";
  return timeInput.length === 5 ? `${timeInput}:00` : timeInput;
}

const DEFAULT_FORM = {
  selectedServiceId: "",
  newDesc: "",
  address: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  appointmentTime: "08:00",
};

const QUICK_DESC_TAGS = [
  "Sơn lại căn hộ chung cư",
  "Tường ẩm mốc, bong tróc",
  "Sơn nhà mới hoàn thiện",
  "Sơn chống thấm ngoại thất",
  "Dặm vá sơn phòng khách",
  "Sơn bóng cao cấp dễ lau chùi",
];

export default function CustomerBooking() {
  const { user: profile, showToast } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [services, setServices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setFormState] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  // Active Time Group Tab (Sáng / Chiều / Tối)
  const [activeTimeGroup, setActiveTimeGroup] = useState("Sáng");

  // Hanoi Address Breakdown
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Giám sát viên cũ
  const [formerSupervisors, setFormerSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);

  const setForm = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const srvRes = await AxiosConfig.get("/services");
        const srvList = srvRes.data || [];
        setServices(srvList);

        // Kiểm tra xem có serviceId truyền từ trang Home qua state hoặc query param không
        const queryParams = new URLSearchParams(location.search);
        const preselectedId = location.state?.serviceId || queryParams.get("serviceId");

        if (preselectedId && srvList.some((s) => String(s.id) === String(preselectedId))) {
          setForm("selectedServiceId", preselectedId);
        } else if (srvList.length > 0) {
          setForm("selectedServiceId", srvList[0].id);
        }

        // Điền trước địa chỉ khách hàng nếu có
        if (profile?.address) {
          const parsed = parseHanoiAddress(profile.address);
          if (parsed.isHanoi) {
            setSelectedDistrict(parsed.district);
            setSelectedWard(parsed.ward);
            setStreetAddress(parsed.street);
            setForm(
              "address",
              formatHanoiAddress(parsed.street, parsed.ward, parsed.district)
            );
          } else {
            const clean = cleanStreetAddress(profile.address);
            setStreetAddress(clean);
            setForm("address", profile.address);
          }
        }

        // Lấy danh sách giám sát viên cũ đã từng phụ trách cho khách
        try {
          const supRes = await AxiosConfig.get("/staff/former-supervisors");
          setFormerSupervisors(supRes.data || []);
        } catch (supErr) {
          console.error("Lỗi tải danh sách giám sát cũ:", supErr);
        }
      } catch (err) {
        console.error(err);
        showToast?.("Không thể tải thông tin dịch vụ", "error");
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [profile, location.search, location.state]);

  const handleDistrictChange = (e) => {
    const districtName = e.target.value;
    setSelectedDistrict(districtName);
    setSelectedWard("");

    const newFullAddr = formatHanoiAddress(streetAddress, "", districtName);
    setForm("address", newFullAddr);
  };

  const handleWardChange = (e) => {
    const wardName = e.target.value;
    setSelectedWard(wardName);

    const newFullAddr = formatHanoiAddress(streetAddress, wardName, selectedDistrict);
    setForm("address", newFullAddr);
  };

  const handleStreetChange = (e) => {
    const val = e.target.value;
    setStreetAddress(val);

    const newFullAddr = formatHanoiAddress(val, selectedWard, selectedDistrict);
    setForm("address", newFullAddr);
  };

  const handleFillProfileAddress = () => {
    if (!profile?.address) {
      showToast?.("Bạn chưa lưu địa chỉ trong hồ sơ tài khoản!", "info");
      return;
    }
    const parsed = parseHanoiAddress(profile.address);
    if (parsed.isHanoi) {
      setSelectedDistrict(parsed.district);
      setSelectedWard(parsed.ward);
      setStreetAddress(parsed.street);
      const full = formatHanoiAddress(parsed.street, parsed.ward, parsed.district);
      setForm("address", full);
    } else {
      setStreetAddress(cleanStreetAddress(profile.address));
      setForm("address", profile.address);
    }
    showToast?.("Đã nạp địa chỉ từ hồ sơ cá nhân!", "success");
  };

  const handleSelectTimeSlot = (time, group) => {
    setForm("appointmentTime", time);
    if (group) setActiveTimeGroup(group);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.selectedServiceId) newErrors.selectedServiceId = "Vui lòng chọn dịch vụ";
    if (!form.appointmentDate) newErrors.appointmentDate = "Vui lòng chọn ngày khảo sát";
    if (!form.appointmentTime) newErrors.appointmentTime = "Vui lòng chọn giờ hẹn khảo sát";

    const fullAddr = selectedDistrict
      ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
      : form.address;

    if (!fullAddr.trim()) {
      newErrors.address = "Vui lòng chọn địa chỉ công trình tại Hà Nội";
    } else if (selectedDistrict && !selectedWard) {
      newErrors.address = "Vui lòng chọn Phường / Xã";
    } else if (selectedDistrict && !streetAddress.trim()) {
      newErrors.address = "Vui lòng nhập Số nhà, Tên đường";
    }

    if (!form.newDesc.trim()) {
      newErrors.newDesc = "Vui lòng nhập mô tả hiện trạng công trình";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetForm = () => {
    setFormState(DEFAULT_FORM);
    setSelectedDistrict("");
    setSelectedWard("");
    setStreetAddress("");
    setSelectedSupervisorId(null);
    setActiveTimeGroup("Sáng");
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast?.("Vui lòng điền đủ các thông tin bắt buộc!", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const finalAddress = selectedDistrict
        ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
        : form.address;

      const payload = {
        customerId: Number(profile.id),
        serviceId: Number(form.selectedServiceId),
        preferredSupervisorId: selectedSupervisorId || null,
        preferredTechnicianId: null,
        appointmentDate: form.appointmentDate,
        appointmentTime: formatTime(form.appointmentTime),
        address: finalAddress.trim(),
        description: form.newDesc.trim(),
        status: "PENDING",
      };

      const res = await AxiosConfig.post("/bookings", payload);
      showToast?.(
        "Gửi yêu cầu khảo sát thành công! Hệ thống sẽ điều phối giám sát viên phụ trách sớm nhất.",
        "success"
      );
      handleResetForm();

      if (res.data?.id) {
        navigate(`/customer/bookings/${res.data.id}`);
      } else {
        navigate("/customer/ongoing");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Không thể gửi yêu cầu. Vui lòng thử lại!";
      showToast?.("Lỗi: " + errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <LoadingSpinner message="Đang chuẩn bị biểu mẫu đặt lịch..." />;

  const selectedService = services.find(
    (s) => String(s.id) === String(form.selectedServiceId)
  );

  const districtObj = HANOI_DISTRICTS.find((d) => d.name === selectedDistrict);

  const handleQuickTagClick = (tag) => {
    setFormState((prev) => {
      const current = prev.newDesc ? prev.newDesc.trim() : "";
      if (!current) return { ...prev, newDesc: tag };
      if (current.includes(tag)) return prev;
      return { ...prev, newDesc: `${current}, ${tag.toLowerCase()}` };
    });
    if (errors.newDesc) setErrors((prev) => ({ ...prev, newDesc: "" }));
  };

  const computedFullAddress = selectedDistrict
    ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
    : form.address?.trim() || "Chưa nhập địa chỉ";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
              ★ MIỄN PHÍ 100% KHẢO SÁT
            </span>
            <span className="text-xs font-semibold text-slate-500">Toàn khu vực TP. Hà Nội</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đăng Ký Khảo Sát &amp; Lập Dự Toán Sơn Nhà
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chuyên viên đến tận nơi đo đạc diện tích thực tế, kiểm tra độ ẩm tường và tư vấn màu sắc hoàn toàn miễn phí.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/customer/ongoing")}
          className="self-start sm:self-auto text-xs font-bold text-slate-700 hover:text-[#1E3A8A] bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl transition flex items-center gap-2 shadow-2xs cursor-pointer shrink-0"
        >
          <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
          <span>Quản lý công trình đã tạo</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Cảnh báo tài khoản khóa nếu có */}
      {profile?.status === "RESTRICTED" && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h4 className="text-rose-900 font-bold text-xs sm:text-sm">Tài khoản đang bị hạn chế</h4>
            <p className="text-rose-700 text-xs">Bạn tạm thời không thể gửi yêu cầu mới. Vui lòng liên hệ tổng đài hỗ trợ.</p>
          </div>
        </div>
      )}

      {/* 2. Main 3-Step Form & Sticky Sidebar Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 Cols on Desktop */}
        <div className="lg:col-span-7 space-y-6">
          {/* BƯỚC 1: DỊCH VỤ & HIỆN TRẠNG */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#1E3A8A] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Chọn Gói Dịch Vụ &amp; Hiện Trạng
                  </h3>
                  <p className="text-[11px] text-slate-400">Chọn giải pháp sơn phù hợp với nhu cầu của bạn</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-500">* Bắt buộc</span>
            </div>

            {/* Service Grid Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Các gói dịch vụ tiêu chuẩn
              </label>

              {services.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-2xl">
                  Đang tải danh mục dịch vụ...
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((s) => {
                    const active = String(form.selectedServiceId) === String(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm("selectedServiceId", s.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                          active
                            ? "border-[#1E3A8A] bg-blue-50/70 shadow-sm ring-2 ring-[#1E3A8A]/15"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            active ? "bg-[#1E3A8A] text-white shadow-xs" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Paintbrush className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 pr-4">
                          <div className={`text-xs font-bold leading-tight ${active ? "text-[#1E3A8A]" : "text-slate-900"}`}>
                            {s.name}
                          </div>
                          {(s.price || s.basePrice) && (
                            <div className="text-[11px] text-slate-500 mt-1 font-medium">
                              {s.price || `Từ ${Number(s.basePrice).toLocaleString("vi-VN")} đ/m²`}
                            </div>
                          )}
                        </div>

                        {active && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 absolute top-3 right-3 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.selectedServiceId && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-bold">{errors.selectedServiceId}</p>
              )}
            </div>

            {/* Description & Quick Suggestions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mô tả sơ bộ hiện trạng công trình
                </label>
                <span className="text-[10px] text-slate-400 font-medium">{form.newDesc.length}/500 ký tự</span>
              </div>
              <textarea
                placeholder="Ví dụ: Căn hộ 75m2 tại Cầu Giấy, tường phòng ngủ bị ẩm mốc cần cạo bả và sơn lại; phòng khách sơn phủ màu trắng kem..."
                value={form.newDesc}
                onChange={(e) => setForm("newDesc", e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 text-xs border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition resize-none leading-relaxed ${
                  errors.newDesc ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                }`}
              />

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5 mt-2">
                <span className="text-[10.5px] text-slate-400 font-semibold block">Gợi ý nhanh (bấm để thêm vào mô tả):</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {QUICK_DESC_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleQuickTagClick(tag)}
                      className="text-[10.5px] font-medium px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-[#1E3A8A] transition cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
              {errors.newDesc && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-bold">{errors.newDesc}</p>
              )}
            </div>
          </div>

          {/* BƯỚC 2: THỜI GIAN & ĐỊA ĐIỂM */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#1E3A8A] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Thời Gian Hẹn &amp; Địa Điểm Khảo Sát
                  </h3>
                  <p className="text-[11px] text-slate-400">Chọn lịch hẹn thuận tiện nhất cho gia đình bạn</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-500">* Bắt buộc</span>
            </div>

            {/* Date & Period Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Ngày hẹn khảo sát
                  </label>
                  <input
                    type="date"
                    value={form.appointmentDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm("appointmentDate", e.target.value)}
                    className={`w-full px-4 py-2.5 text-xs font-semibold border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition ${
                      errors.appointmentDate ? "border-rose-300" : "border-slate-200"
                    }`}
                  />
                  {errors.appointmentDate && (
                    <p className="text-[11px] text-rose-500 mt-1 font-bold">{errors.appointmentDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Buổi khảo sát
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                    {TIME_SLOT_GROUPS.map((grp) => {
                      const isActive = activeTimeGroup === grp.group;
                      return (
                        <button
                          key={grp.group}
                          type="button"
                          onClick={() => {
                            setActiveTimeGroup(grp.group);
                            if (grp.slots.length > 0) {
                              setForm("appointmentTime", grp.slots[0].time);
                            }
                          }}
                          className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isActive
                              ? "bg-white text-[#1E3A8A] shadow-xs font-black"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {grp.group === "Sáng" && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                          {grp.group === "Chiều" && <Sunset className="w-3.5 h-3.5 text-orange-500" />}
                          {grp.group === "Tối" && <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                          <span>{grp.group}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-2">
                  Chọn giờ chuyên viên đến ({activeTimeGroup}):
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOT_GROUPS.find((g) => g.group === activeTimeGroup)?.slots.map((slot) => {
                    const isSelected = form.appointmentTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectTimeSlot(slot.time, activeTimeGroup)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-xs font-black"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span>{slot.time}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-400 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
                {errors.appointmentTime && (
                  <p className="text-[11px] text-rose-500 mt-1 font-bold">{errors.appointmentTime}</p>
                )}
              </div>
            </div>

            {/* Address Cascading Selector (Hanoi) */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Địa chỉ công trình (Hà Nội)
                </label>
                {profile?.address && (
                  <button
                    type="button"
                    onClick={handleFillProfileAddress}
                    className="text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Lấy từ hồ sơ cá nhân</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <select
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  >
                    <option value="">-- Chọn Quận / Huyện --</option>
                    {HANOI_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedWard}
                    onChange={handleWardChange}
                    disabled={!selectedDistrict}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">-- Chọn Phường / Xã --</option>
                    {districtObj?.wards.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Số nhà, tên ngõ / ngách / đường..."
                  value={streetAddress}
                  onChange={handleStreetChange}
                  className={`flex-1 px-4 py-2.5 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition ${
                    errors.address ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMapModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  <Map className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Bản đồ</span>
                </button>
              </div>

              {/* Address preview badge */}
              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                <span className="truncate">
                  <strong className="text-slate-900">Địa chỉ khảo sát:</strong>{" "}
                  {computedFullAddress}
                </span>
              </div>

              {errors.address && (
                <p className="text-[11px] text-rose-500 font-bold">{errors.address}</p>
              )}
            </div>

            {/* Modal Map Selector */}
            <AddressMapModal
              isOpen={mapModalOpen}
              onClose={() => setMapModalOpen(false)}
              initialDistrict={selectedDistrict}
              initialWard={selectedWard}
              initialStreet={streetAddress}
              initialAddress={form.address}
              title="Chọn địa chỉ công trình trên Bản đồ Hà Nội"
              onConfirm={(loc) => {
                if (loc.district) setSelectedDistrict(loc.district);
                if (loc.ward) setSelectedWard(loc.ward);
                if (loc.street) setStreetAddress(loc.street);
                const newFull = loc.district
                  ? formatHanoiAddress(loc.street, loc.ward, loc.district)
                  : loc.fullAddress;
                setForm("address", newFull);
                showToast?.("Đã cập nhật vị trí công trình từ bản đồ!", "success");
              }}
            />
          </div>

          {/* BƯỚC 3: GIÁM SÁT VIÊN */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-[#1E3A8A] text-white font-black text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Giám Sát Viên Khảo Sát
                  </h3>
                  <p className="text-[11px] text-slate-400">Chọn người phụ trách hoặc để hệ thống chọn tối ưu</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">Tùy chọn</span>
            </div>

            {/* Smart Auto-dispatch Option */}
            <button
              type="button"
              onClick={() => setSelectedSupervisorId(null)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                selectedSupervisorId === null
                  ? "border-[#1E3A8A] bg-blue-50/70 shadow-xs ring-2 ring-[#1E3A8A]/15"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedSupervisorId === null ? "bg-[#1E3A8A] text-white shadow-xs" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Tự động phân công tối ưu
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Hệ thống tự động điều phối giám sát viên gần công trình nhất, đánh giá 5★ và trống lịch hẹn.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedSupervisorId === null ? "border-[#1E3A8A] bg-[#1E3A8A] text-white" : "border-slate-300 bg-white"
                }`}
              >
                {selectedSupervisorId === null && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* Danh sách giám sát viên cũ nếu có */}
            {formerSupervisors.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-slate-700">
                  Hoặc chọn lại chuyên viên đã từng phục vụ bạn:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formerSupervisors.map((sup) => {
                    const isSelected = selectedSupervisorId === sup.userId;
                    return (
                      <button
                        key={sup.userId}
                        type="button"
                        onClick={() => setSelectedSupervisorId(sup.userId)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-blue-50/80 border-[#1E3A8A] shadow-xs ring-2 ring-[#1E3A8A]/15"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {sup.avatar ? (
                            <img
                              src={sup.avatar}
                              alt={sup.username}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1E3A8A] font-black text-xs flex items-center justify-center shrink-0">
                              {sup.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">
                              @{sup.username}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 mt-0.5">
                              <span className="flex items-center text-amber-600 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> {sup.rating || "5.0"}
                              </span>
                              <span>• {sup.bookingCountWithCustomer} lần phục vụ</span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#1E3A8A] bg-[#1E3A8A] text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Summary Sidebar: 5 Cols on Desktop */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 lg:sticky lg:top-24 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tóm Tắt Lịch Hẹn Khảo Sát
                </h4>
                <p className="text-[10px] text-slate-400">Kiểm tra thông tin trước khi gửi</p>
              </div>
              <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Khảo sát tại nhà
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-400 font-medium shrink-0">Gói dịch vụ:</span>
                <span className="font-bold text-[#1E3A8A] text-right truncate">
                  {selectedService?.name || "Chưa chọn"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-medium">Ngày hẹn:</span>
                <span className="font-bold text-slate-900">
                  {form.appointmentDate || "Chưa chọn"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-medium">Khung giờ:</span>
                <span className="font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg font-mono">
                  {form.appointmentTime ? `${form.appointmentTime} (${activeTimeGroup})` : "Chưa chọn"}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400 font-medium">Giám sát viên:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[160px]">
                  {selectedSupervisorId
                    ? `@${formerSupervisors.find((s) => s.userId === selectedSupervisorId)?.username || "Đã chọn"}`
                    : "Tự động phân công tối ưu"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium block text-[11px] mb-1">Địa điểm công trình:</span>
                <p className="text-slate-800 text-[11.5px] font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200/70 break-words line-clamp-3">
                  {computedFullAddress}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Phí khảo sát &amp; lập dự toán:</span>
                <span className="text-[10.5px] text-slate-400">Không có phụ phí ẩn</span>
              </div>
              <span className="text-lg font-black text-emerald-600">0 đ (MIỄN PHÍ)</span>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={profile?.status === "RESTRICTED" || submitting}
              className={`w-full py-4 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                profile?.status === "RESTRICTED" || submitting
                  ? "bg-slate-300 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] shadow-amber-500/30 hover:shadow-lg"
              }`}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang gửi yêu cầu...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>GỬI YÊU CẦU KHẢO SÁT NGAY</span>
                </>
              )}
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResetForm}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm mới lại biểu mẫu</span>
              </button>
            </div>

            {/* Reassurance & Commitments */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100/90 text-[#1E3A8A] space-y-2 text-xs">
              <div className="font-black flex items-center gap-2 text-xs text-[#1E3A8A]">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Cam kết dịch vụ Precision Paint</span>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Khảo sát, đo đạc &amp; lên dự toán miễn phí 100%</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Chuyên viên có mặt đúng khung giờ đã đăng ký</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Báo giá minh bạch, tuyệt đối không phát sinh chi phí</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}