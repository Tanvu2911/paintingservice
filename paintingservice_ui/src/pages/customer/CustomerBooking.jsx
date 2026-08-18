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
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import LoadingSpinner from "../../components/common/LoadingSpinner";
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
    setActiveTimeGroup("Sáng");
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast?.("Vui lòng điền đủ thông tin bắt buộc!", "warning");
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

  if (loadingData) return <LoadingSpinner />;

  const selectedService = services.find(
    (s) => String(s.id) === String(form.selectedServiceId)
  );

  const districtObj = HANOI_DISTRICTS.find((d) => d.name === selectedDistrict);

  const getTimeGroupIcon = (group) => {
    if (group === "Sáng") return <Sun className="w-4 h-4" />;
    if (group === "Chiều") return <Sunset className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đăng ký khảo sát công trình
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Đặt lịch khảo sát &amp; báo giá tận nơi hoàn toàn <strong>miễn phí</strong> tại khu vực Hà Nội.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/customer/ongoing")}
          className="self-start sm:self-auto text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <ClipboardList className="w-4 h-4 text-emerald-600" />
          <span>Xem yêu cầu đang làm</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Restricted banner */}
      {profile?.status === "RESTRICTED" && (
        <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-rose-800 font-bold text-sm">
              Tài khoản đang bị khóa
            </h4>
            <p className="text-rose-600 text-xs mt-0.5">
              Bạn không thể gửi yêu cầu mới. Vui lòng liên hệ tổng đài hỗ trợ.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Thông tin công trình &amp; Lịch hẹn</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Khu vực Hà Nội
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Service Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                Hạng mục cần cải tạo <span className="text-rose-500">*</span>
              </label>
              {services.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                  Chưa có danh sách dịch vụ
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {services.map((s) => {
                    const active = String(form.selectedServiceId) === String(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setForm("selectedServiceId", s.id)}
                        className={`text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          active
                            ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                            <Paintbrush className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-xs font-bold truncate ${
                                active ? "text-emerald-900" : "text-slate-800"
                              }`}
                            >
                              {s.name}
                            </div>
                            {(s.price || s.basePrice) && (
                              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                {s.price ||
                                  (s.basePrice
                                    ? `Từ ${Number(s.basePrice).toLocaleString("vi-VN")} đ / m²`
                                    : "")}
                              </div>
                            )}
                          </div>
                          {active && (
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.selectedServiceId && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                  {errors.selectedServiceId}
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Ngày hẹn khảo sát <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={form.appointmentDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm("appointmentDate", e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition ${
                    errors.appointmentDate ? "border-rose-300" : "border-slate-200"
                  }`}
                />
              </div>
              {errors.appointmentDate && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {errors.appointmentDate}
                </p>
              )}
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn giờ khảo sát theo khung <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg shadow-xs">
                  Đang chọn: {form.appointmentTime || "Chưa chọn"}
                </span>
              </div>

              {/* Group Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOT_GROUPS.map((grp) => {
                  const isGroupActive = activeTimeGroup === grp.group;
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
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                        isGroupActive
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{getTimeGroupIcon(grp.group)}</span>
                      <span className="text-xs font-bold">{grp.label}</span>
                      <span
                        className={`text-[10px] ${
                          isGroupActive ? "text-emerald-100" : "text-slate-400"
                        }`}
                      >
                        {grp.period}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Individual Slots */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                  Chọn khung giờ chi tiết ({TIME_SLOT_GROUPS.find((g) => g.group === activeTimeGroup)?.label}):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOT_GROUPS.find((g) => g.group === activeTimeGroup)?.slots.map((slot) => {
                    const isSelected = form.appointmentTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectTimeSlot(slot.time, activeTimeGroup)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{slot.time}</span>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                          {slot.range}
                        </div>
                        <div className={`text-[9px] font-normal ${isSelected ? "text-emerald-200" : "text-slate-400"}`}>
                          {slot.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errors.appointmentTime && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {errors.appointmentTime}
                </p>
              )}
            </div>

            {/* Address Cascading Selector (Hanoi) */}
            <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Địa chỉ công trình tại Hà Nội <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Quận / Huyện
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="">-- Chọn Quận / Huyện (HN) --</option>
                    {HANOI_DISTRICTS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Phường / Xã
                  </label>
                  <select
                    value={selectedWard}
                    onChange={handleWardChange}
                    disabled={!selectedDistrict}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
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

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Số nhà, tên đường / ngõ, tòa nhà
                </label>
                <input
                  type="text"
                  placeholder="VD: Số 29 ngõ 45 đường Trần Thái Tông"
                  value={streetAddress}
                  onChange={handleStreetChange}
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition ${
                    errors.address ? "border-rose-300" : "border-slate-200"
                  }`}
                />
              </div>

              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 break-words flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 font-semibold">Địa chỉ ghi nhận:</span>{" "}
                  <span className="font-bold text-slate-800">
                    {selectedDistrict
                      ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
                      : form.address || "Chưa nhập địa chỉ"}
                  </span>
                </div>
              </div>

              {errors.address && (
                <p className="text-[11px] text-rose-500 font-medium">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mô tả hiện trạng &amp; Yêu cầu cụ thể <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Ví dụ: Căn hộ 70m2 tại Cầu Giấy, tường phòng khách bị ố vàng và bong tróc, cần cạo sạch bả matit và sơn phủ 2 lớp màu trắng kem..."
                value={form.newDesc}
                onChange={(e) => setForm("newDesc", e.target.value)}
                rows={3}
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition resize-none ${
                  errors.newDesc ? "border-rose-300" : "border-slate-200"
                }`}
              />
              <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                {errors.newDesc ? (
                  <span className="text-rose-500 font-medium">{errors.newDesc}</span>
                ) : (
                  <span>Mô tả chi tiết giúp kỹ thuật viên chuẩn bị phương án tốt nhất</span>
                )}
                <span>{form.newDesc.length}/500</span>
              </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Hệ thống sẽ <strong>tự động chỉ định giám sát viên phụ trách khu vực của bạn</strong> để liên hệ xác nhận lịch hẹn và đến khảo sát trực tiếp.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Làm mới</span>
              </button>
              <button
                type="submit"
                disabled={profile?.status === "RESTRICTED" || submitting}
                className={`flex-1 py-3 text-white font-bold rounded-2xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  profile?.status === "RESTRICTED" || submitting
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]"
                }`}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang gửi yêu cầu...
                  </span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi yêu cầu đăng ký khảo sát</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 sticky top-24 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tóm tắt yêu cầu
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Hạng mục</span>
                <span className="font-bold text-emerald-800 text-right">
                  {selectedService?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Ngày khảo sát</span>
                <span className="font-bold text-slate-900">
                  {form.appointmentDate || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Khung giờ hẹn</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {form.appointmentTime ? `${form.appointmentTime} (${activeTimeGroup})` : "—"}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1 font-semibold">Địa chỉ công trình</span>
                <p className="font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-snug break-words">
                  {selectedDistrict
                    ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
                    : form.address?.trim() || "Chưa nhập địa chỉ"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cam kết dịch vụ</span>
              </div>
              <div className="text-[11px] text-slate-600 leading-relaxed space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Khảo sát hiện trạng &amp; dự toán <strong>miễn phí 100%</strong></span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Thanh toán an toàn qua cổng VNPay Sandbox</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Hợp đồng điện tử &amp; bảo hành dài hạn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}