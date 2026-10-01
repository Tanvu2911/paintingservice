import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  Check,
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
  Sparkles,
  Map,
  Star,
  Info,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AddressMapModal from "../../components/common/AddressMapModal";
import StaffDetailModal from "../../components/common/StaffDetailModal";
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
  selectedServiceIds: [],
  newDesc: "",
  address: "",
  appointmentDate: new Date().toISOString().split("T")[0],
  appointmentTime: "08:00",
};

const QUICK_DESC_TAGS = [
  "Sơn lại căn hộ",
  "Tường ẩm mốc",
  "Sơn nhà mới",
  "Chống thấm",
  "Dặm vá sơn",
  "Sơn cao cấp",
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

  // Giám sát viên khảo sát (chỉ chọn giám sát viên để gửi yêu cầu khảo sát)
  const [formerSupervisors, setFormerSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);

  const setForm = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleToggleService = (sId) => {
    const currentIds = form.selectedServiceIds || [];
    let newIds;
    if (currentIds.some((id) => String(id) === String(sId))) {
      if (currentIds.length <= 1) {
        showToast?.("Vui lòng chọn ít nhất một gói dịch vụ", "info");
        return;
      }
      newIds = currentIds.filter((id) => String(id) !== String(sId));
    } else {
      newIds = [...currentIds, sId];
    }
    setForm("selectedServiceIds", newIds);
    setForm("selectedServiceId", newIds[0] || "");
  };

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const srvRes = await AxiosConfig.get("/services");
        const srvList = srvRes.data || [];
        setServices(srvList);

        const queryParams = new URLSearchParams(location.search);
        const preselectedId = location.state?.serviceId || queryParams.get("serviceId");

        if (preselectedId && srvList.some((s) => String(s.id) === String(preselectedId))) {
          setForm("selectedServiceId", preselectedId);
          setForm("selectedServiceIds", [preselectedId]);
        } else if (srvList.length > 0) {
          setForm("selectedServiceId", srvList[0].id);
          setForm("selectedServiceIds", [srvList[0].id]);
        }

        // Điền trước địa chỉ nếu có trong hồ sơ
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

        // Lấy danh sách giám sát viên cũ đã từng phục vụ khách hàng
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

  const handleViewSupervisorProfile = async (sup, e) => {
    if (e) e.stopPropagation();
    try {
      if (sup.userId) {
        const res = await AxiosConfig.get(`/staff/by-user/${sup.userId}`);
        if (res.data) {
          setSelectedStaffProfile(res.data);
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch full staff profile", err);
    }

    setSelectedStaffProfile({
      username: sup.username || "Chuyên viên",
      fullName: sup.fullName || sup.username || "Giám sát viên khảo sát",
      phoneNumber: sup.phoneNumber || "",
      avatar: sup.avatar || "",
      staffType: "SUPERVISOR",
      specialty: "Giám sát & Khảo sát công trình, tư vấn màu sơn",
      experienceYears: 5,
      rating: sup.rating || 5.0,
      serviceArea: "Hà Nội",
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.selectedServiceId && (!form.selectedServiceIds || form.selectedServiceIds.length === 0)) {
      newErrors.selectedServiceId = "Vui lòng chọn ít nhất một dịch vụ";
    }
    if (!form.appointmentDate) newErrors.appointmentDate = "Vui lòng chọn ngày khảo sát";
    if (!form.appointmentTime) newErrors.appointmentTime = "Vui lòng chọn giờ hẹn khảo sát";

    const fullAddr = selectedDistrict
      ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
      : form.address;

    if (!fullAddr.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ công trình";
    } else if (selectedDistrict && !selectedWard) {
      newErrors.address = "Vui lòng chọn Phường / Xã";
    } else if (selectedDistrict && !streetAddress.trim()) {
      newErrors.address = "Vui lòng nhập Số nhà, Tên đường";
    }

    if (!form.newDesc.trim()) {
      newErrors.newDesc = "Vui lòng nhập mô tả sơ bộ hiện trạng";
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

      const chosenServiceIds = (form.selectedServiceIds && form.selectedServiceIds.length > 0)
        ? form.selectedServiceIds.map(Number)
        : (form.selectedServiceId ? [Number(form.selectedServiceId)] : []);

      const bookingServicesPayload = chosenServiceIds.map((sId) => ({
        serviceId: sId,
      }));

      const payload = {
        customerId: Number(profile.id),
        serviceId: chosenServiceIds[0] || Number(form.selectedServiceId),
        serviceIds: chosenServiceIds,
        bookingServices: bookingServicesPayload,
        preferredSupervisorId: selectedSupervisorId || null,
        appointmentDate: form.appointmentDate,
        appointmentTime: formatTime(form.appointmentTime),
        address: finalAddress.trim(),
        description: form.newDesc.trim(),
        status: "PENDING",
      };

      const res = await AxiosConfig.post("/bookings", payload);
      showToast?.(
        "Gửi yêu cầu khảo sát thành công! Chuyên viên giám sát sẽ liên hệ sớm nhất.",
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

  const selectedServicesList = services.filter((s) =>
    (form.selectedServiceIds || []).some((id) => String(id) === String(s.id))
    || String(form.selectedServiceId) === String(s.id)
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
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* 1. Header Bar - Compact & Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              MIỄN PHÍ KHẢO SÁT 100%
            </span>
            <span className="text-xs text-slate-500">Khu vực Hà Nội</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Đặt Lịch Khảo Sát &amp; Lập Dự Toán Sơn Nhà
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chuyên viên đến tận nơi đo đạc diện tích thực tế và tư vấn màu sắc hoàn toàn miễn phí.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/customer/ongoing")}
          className="self-start sm:self-auto text-xs font-bold text-slate-700 hover:text-[#1E3A8A] bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
        >
          <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
          <span>Danh sách công trình</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {profile?.status === "RESTRICTED" && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="text-rose-700 text-xs font-medium">
            Tài khoản của bạn đang bị hạn chế tạo yêu cầu mới. Vui lòng liên hệ hỗ trợ.
          </p>
        </div>
      )}

      {/* 2. Main 2-Column Form Layout (Left Form, Right Sticky Summary) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 8 Cols */}
        <div className="lg:col-span-8 space-y-4">
          {/* BƯỚC 1: DỊCH VỤ SƠN & MÔ TẢ HIỆN TRẠNG */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Chọn Gói Dịch Vụ &amp; Mô Tả Hiện Trạng
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Đã chọn {form.selectedServiceIds?.length || 1} gói
              </span>
            </div>

            {/* Service Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {services.map((s) => {
                const active =
                  (form.selectedServiceIds || []).some((id) => String(id) === String(s.id)) ||
                  String(form.selectedServiceId) === String(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleService(s.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      active
                        ? "border-[#1E3A8A] bg-blue-50/70 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? "bg-[#1E3A8A] text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Paintbrush className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${active ? "text-[#1E3A8A]" : "text-slate-900"}`}>
                          {s.name}
                        </div>
                        {(s.price || s.basePrice) && (
                          <div className="text-[10.5px] text-slate-500 font-medium">
                            {s.price || `Từ ${Number(s.basePrice).toLocaleString("vi-VN")} đ/m²`}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        active
                          ? "bg-[#1E3A8A] border-[#1E3A8A] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.selectedServiceId && (
              <p className="text-[11px] text-rose-500 font-bold">{errors.selectedServiceId}</p>
            )}

            {/* Description & Quick Suggestions */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Mô tả sơ bộ hiện trạng công trình
                </label>
                <span className="text-[10px] text-slate-400">{form.newDesc.length}/500 ký tự</span>
              </div>
              <textarea
                placeholder="Ví dụ: Căn hộ 70m2, tường phòng ngủ bị ẩm mốc cần cạo bả và sơn lại; phòng khách sơn màu trắng kem..."
                value={form.newDesc}
                onChange={(e) => setForm("newDesc", e.target.value)}
                rows={2}
                className={`w-full px-3 py-2 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition resize-none leading-relaxed ${
                  errors.newDesc ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                }`}
              />

              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <span className="text-[10.5px] text-slate-400 font-medium">Gợi ý nhanh:</span>
                {QUICK_DESC_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="text-[10.5px] font-medium px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-[#1E3A8A] transition cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              {errors.newDesc && (
                <p className="text-[11px] text-rose-500 mt-1 font-bold">{errors.newDesc}</p>
              )}
            </div>
          </div>

          {/* BƯỚC 2: THỜI GIAN & ĐỊA ĐIỂM KHẢO SÁT */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Thời Gian Hẹn &amp; Địa Chỉ Khảo Sát
                </h3>
              </div>
              <span className="text-[11px] font-bold text-rose-500">* Bắt buộc</span>
            </div>

            {/* Date & Time Slot Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Ngày hẹn
                </label>
                <input
                  type="date"
                  value={form.appointmentDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm("appointmentDate", e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition ${
                    errors.appointmentDate ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                {errors.appointmentDate && (
                  <p className="text-[11px] text-rose-500 font-bold">{errors.appointmentDate}</p>
                )}
              </div>

              <div className="sm:col-span-7 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Khung giờ ({activeTimeGroup})
                  </label>
                  <div className="flex gap-1">
                    {TIME_SLOT_GROUPS.map((grp) => (
                      <button
                        key={grp.group}
                        type="button"
                        onClick={() => {
                          setActiveTimeGroup(grp.group);
                          if (grp.slots.length > 0) setForm("appointmentTime", grp.slots[0].time);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition cursor-pointer ${
                          activeTimeGroup === grp.group
                            ? "bg-[#1E3A8A] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {grp.group}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {TIME_SLOT_GROUPS.find((g) => g.group === activeTimeGroup)?.slots.map((slot) => {
                    const isSelected = form.appointmentTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => handleSelectTimeSlot(slot.time, activeTimeGroup)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-bold font-mono transition text-center cursor-pointer ${
                          isSelected
                            ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-2xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
                {errors.appointmentTime && (
                  <p className="text-[11px] text-rose-500 font-bold">{errors.appointmentTime}</p>
                )}
              </div>
            </div>

            {/* Address Form (Hanoi) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Địa chỉ công trình tại Hà Nội
                </label>
                {profile?.address && (
                  <button
                    type="button"
                    onClick={handleFillProfileAddress}
                    className="text-[11px] font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    Dùng địa chỉ hồ sơ
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  <option value="">-- Chọn Quận / Huyện --</option>
                  {HANOI_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedWard}
                  onChange={handleWardChange}
                  disabled={!selectedDistrict}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">-- Chọn Phường / Xã --</option>
                  {districtObj?.wards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Số nhà, tên ngõ / ngách / đường..."
                  value={streetAddress}
                  onChange={handleStreetChange}
                  className={`flex-1 px-3 py-2 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition ${
                    errors.address ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMapModalOpen(true)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Map className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Bản đồ</span>
                </button>
              </div>

              {errors.address && (
                <p className="text-[11px] text-rose-500 font-bold">{errors.address}</p>
              )}
            </div>

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

          {/* BƯỚC 3: GIÁM SÁT VIÊN KHẢO SÁT (BẤM ĐỂ XEM CHI TIẾT HỒ SƠ) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Chuyên Viên Giám Sát Khảo Sát
                </h3>
              </div>
              <span className="text-[10.5px] text-slate-400">Tùy chọn</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSupervisorId(null)}
              className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2.5 ${
                selectedSupervisorId === null
                  ? "border-[#1E3A8A] bg-blue-50/70 shadow-2xs"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedSupervisorId === null ? "bg-[#1E3A8A] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Tự động phân công tối ưu
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Hệ thống tự động điều phối chuyên viên gần công trình nhất.
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedSupervisorId === null ? "border-[#1E3A8A] bg-[#1E3A8A] text-white" : "border-slate-300 bg-white"
                }`}
              >
                {selectedSupervisorId === null && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>

            {formerSupervisors.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Hoặc chọn chuyên viên từng phục vụ bạn (Bấm để chọn / xem hồ sơ):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formerSupervisors.map((sup) => {
                    const isSelected = selectedSupervisorId === sup.userId;
                    return (
                      <div
                        key={sup.userId}
                        onClick={() => setSelectedSupervisorId(sup.userId)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-blue-50/80 border-[#1E3A8A]"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {sup.avatar ? (
                            <img
                              src={sup.avatar}
                              alt={sup.username}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1E3A8A] font-bold text-xs flex items-center justify-center shrink-0">
                              {sup.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                @{sup.username}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleViewSupervisorProfile(sup, e)}
                                className="text-[10px] text-blue-700 hover:underline font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 shrink-0 flex items-center gap-0.5"
                                title="Xem chi tiết hồ sơ chuyên viên"
                              >
                                <Info className="w-2.5 h-2.5" />
                                <span>Hồ sơ</span>
                              </button>
                            </div>
                            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> {sup.rating || "5.0"}
                              <span className="text-slate-400 font-normal">({sup.bookingCountWithCustomer || 1} lần phục vụ)</span>
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#1E3A8A] bg-[#1E3A8A] text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Summary Sidebar: 4 Cols */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Tóm Tắt Lịch Hẹn
              </h4>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Khảo sát 0đ
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Dịch vụ yêu cầu ({selectedServicesList.length}):</span>
                <div className="space-y-1 mt-1">
                  {selectedServicesList.map((s) => (
                    <div key={s.id} className="font-bold text-[#1E3A8A] flex items-center gap-1.5 text-xs">
                      <Paintbrush className="w-3 h-3 text-[#1E3A8A] shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-slate-400">Thời gian hẹn:</span>
                <span className="font-bold text-slate-900">
                  {form.appointmentDate} • {form.appointmentTime}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-slate-400">Giám sát viên:</span>
                <span className="font-bold text-slate-800 truncate max-w-[140px]">
                  {selectedSupervisorId
                    ? `@${formerSupervisors.find((s) => s.userId === selectedSupervisorId)?.username || "Đã chọn"}`
                    : "Tự động phân công"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-0.5">Địa điểm công trình:</span>
                <p className="text-slate-800 text-[11px] font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 break-words line-clamp-2">
                  {computedFullAddress}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Phí khảo sát:</span>
                <span className="text-sm font-black text-emerald-600">0 đ (MIỄN PHÍ)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={profile?.status === "RESTRICTED" || submitting}
              className={`w-full py-3.5 text-white font-black rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                profile?.status === "RESTRICTED" || submitting
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99]"
              }`}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang gửi yêu cầu...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>GỬI YÊU CẦU KHẢO SÁT</span>
                </>
              )}
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResetForm}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Làm mới biểu mẫu</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[#1E3A8A] space-y-1 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-xs text-[#1E3A8A]">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Cam kết dịch vụ</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Đo đạc, tư vấn báo giá miễn phí 100%. Quý khách không phải trả bất kỳ khoản phí nào nếu không ký hợp đồng.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Modal xem chi tiết hồ sơ chuyên viên */}
      <StaffDetailModal
        isOpen={Boolean(selectedStaffProfile)}
        onClose={() => setSelectedStaffProfile(null)}
        staff={selectedStaffProfile}
      />
    </div>
  );
}