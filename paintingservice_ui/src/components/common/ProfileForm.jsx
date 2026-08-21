import { useState, useEffect } from "react";
import AxiosConfig from "../../util/AxiosConfig";
import AddressMapModal from "./AddressMapModal";
import {
  HANOI_DISTRICTS,
  VIETNAMESE_BANKS,
  parseHanoiAddress,
  formatHanoiAddress,
  cleanStreetAddress,
} from "../../data/hanoiLocations";

export default function ProfileForm({ user, showToast, roleLabel = "Người dùng", isStaff = false }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  // Password Change Section
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Hanoi Address Breakdown
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Staff Specific Fields (Khu vực hoạt động & Tài khoản ngân hàng)
  const [staffData, setStaffData] = useState({
    serviceArea: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    specialty: "",
    experienceYears: 0,
  });

  // Dynamic services list from DB
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [saving, setSaving] = useState(false);

  // Initialize data from user
  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || user.phone || "",
        address: user.address || "",
      });

      const parsed = parseHanoiAddress(user.address);
      if (parsed.isHanoi) {
        setSelectedDistrict(parsed.district);
        setSelectedWard(parsed.ward);
        setStreetAddress(parsed.street);
        setForm((prev) => ({
          ...prev,
          address: formatHanoiAddress(parsed.street, parsed.ward, parsed.district),
        }));
      } else {
        setStreetAddress(cleanStreetAddress(user.address || ""));
      }
    }
  }, [user]);

  // Load Staff Profile and Services if isStaff
  useEffect(() => {
    if (isStaff) {
      const fetchStaffProfile = async () => {
        try {
          const res = await AxiosConfig.get("/staff/me");
          if (res.data) {
            setStaffData({
              serviceArea: res.data.serviceArea || "",
              bankName: res.data.bankName || "",
              bankAccountNumber: res.data.bankAccountNumber || "",
              bankAccountName: res.data.bankAccountName || "",
              specialty: res.data.specialty || "",
              experienceYears: res.data.experienceYears || 0,
            });
          }
        } catch (err) {
          console.error("Error loading staff profile:", err);
        }
      };

      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const res = await AxiosConfig.get("/services");
          const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
          setAvailableServices(list);
        } catch (err) {
          console.error("Error loading services:", err);
        } finally {
          setLoadingServices(false);
        }
      };

      fetchStaffProfile();
      fetchServices();
    }
  }, [isStaff]);

  // Handle district change
  const handleDistrictChange = (e) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);
    setSelectedWard("");
    const newFullAddress = formatHanoiAddress(streetAddress, "", dist);
    setForm((prev) => ({ ...prev, address: newFullAddress }));
  };

  // Handle ward change
  const handleWardChange = (e) => {
    const ward = e.target.value;
    setSelectedWard(ward);
    const newFullAddress = formatHanoiAddress(streetAddress, ward, selectedDistrict);
    setForm((prev) => ({ ...prev, address: newFullAddress }));
  };

  // Handle street address change
  const handleStreetChange = (e) => {
    const street = e.target.value;
    setStreetAddress(street);
    if (selectedDistrict) {
      const newFullAddress = formatHanoiAddress(street, selectedWard, selectedDistrict);
      setForm((prev) => ({ ...prev, address: newFullAddress }));
    } else {
      setForm((prev) => ({ ...prev, address: street }));
    }
  };

  // Handle Staff Working District Toggle
  const toggleWorkingDistrict = (districtName) => {
    let currentAreas = staffData.serviceArea ? staffData.serviceArea.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (currentAreas.includes(districtName)) {
      currentAreas = currentAreas.filter((d) => d !== districtName);
    } else {
      currentAreas.push(districtName);
    }
    setStaffData((prev) => ({ ...prev, serviceArea: currentAreas.join(", ") }));
  };

  // Handle Staff Skill Tag Toggle
  const toggleSkillTag = (skillName) => {
    let currentSkills = staffData.specialty ? staffData.specialty.split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (currentSkills.includes(skillName)) {
      currentSkills = currentSkills.filter((s) => s !== skillName);
    } else {
      currentSkills.push(skillName);
    }
    setStaffData((prev) => ({ ...prev, specialty: currentSkills.join(", ") }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      showToast?.("Không tìm thấy thông tin tài khoản", "error");
      return;
    }

    if (showPasswordSection) {
      if (passwordForm.newPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
        showToast?.("Mật khẩu xác nhận không khớp!", "warning");
        return;
      }
      if (passwordForm.newPassword && passwordForm.newPassword.length < 6) {
        showToast?.("Mật khẩu mới phải có ít nhất 6 ký tự!", "warning");
        return;
      }
    }

    try {
      setSaving(true);

      const finalAddress = selectedDistrict
        ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
        : form.address;

      const userPayload = {
        username: form.username,
        email: form.email?.trim() || null,
        phoneNumber: form.phoneNumber?.trim() || null,
        address: finalAddress?.trim() || null,
      };

      if (showPasswordSection && passwordForm.newPassword) {
        userPayload.password = passwordForm.newPassword;
      }

      // 1. Cập nhật User
      const res = await AxiosConfig.put(`/users/${user.id}`, userPayload);

      // Cập nhật lại localStorage nếu đang đăng nhập tài khoản này
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.id === user.id) {
            localStorage.setItem("user", JSON.stringify({ ...parsed, ...res.data }));
          }
        }
      } catch (e) {}

      // 2. Nếu là Nhân viên -> Cập nhật thêm StaffProfile
      if (isStaff) {
        await AxiosConfig.put("/staff/me", {
          ...userPayload,
          ...staffData,
        });
      }

      showToast?.("Cập nhật thông tin tài khoản thành công!", "success");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.messages?.join?.(", ") ||
        "Không thể cập nhật thông tin";
      showToast?.(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const districtObj = HANOI_DISTRICTS.find((d) => d.name === selectedDistrict);
  const currentWorkingAreas = staffData.serviceArea ? staffData.serviceArea.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const currentSkills = staffData.specialty ? staffData.specialty.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-slate-100 space-y-6 sm:space-y-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shadow-blue-600/20 shrink-0">
            {(user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {user?.username || "Tài khoản người dùng"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                {roleLabel}
              </span>
              <span className="text-xs text-slate-400">Mã ID: #{user?.id}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Thông tin cơ bản */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
            <span>👤</span> Thông tin tài khoản &amp; Liên hệ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                disabled
                value={form.username}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                placeholder="VD: 0987654321"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="VD: example@gmail.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Địa chỉ khu vực Hà Nội */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>📍</span> Địa chỉ khu vực Hà Nội
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMapModalOpen(true)}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              >
                <span>🗺️</span>
                <span>Chọn trên Bản đồ</span>
              </button>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                Khu vực: Hà Nội
              </span>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-200/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Chọn Quận / Huyện (Hà Nội) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Chọn Phường / Xã
                </label>
                <select
                  value={selectedWard}
                  onChange={handleWardChange}
                  disabled={!selectedDistrict}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">-- Chọn Phường / Xã --</option>
                  {districtObj?.wards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                  {selectedWard && !districtObj?.wards?.includes(selectedWard) && (
                    <option value={selectedWard}>{selectedWard}</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Số nhà, tên ngõ/đường, toà nhà
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={handleStreetChange}
                placeholder="VD: Số 29 ngõ 45 đường Trần Thái Tông"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Live Address Preview & Map Quick Open */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs break-words flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-slate-400 font-semibold">Địa chỉ đầy đủ hiển thị:</span>{" "}
                <span className="font-bold text-slate-800">
                  {selectedDistrict
                    ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
                    : form.address || "Chưa thiết lập địa chỉ"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(true)}
                className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer self-end sm:self-auto"
              >
                <span>📍 Mở bản đồ</span>
              </button>
            </div>
          </div>

          {/* Modal Map Selector */}
          <AddressMapModal
            isOpen={mapModalOpen}
            onClose={() => setMapModalOpen(false)}
            initialDistrict={selectedDistrict}
            initialWard={selectedWard}
            initialStreet={streetAddress}
            initialAddress={form.address}
            title="Chọn địa chỉ hồ sơ trên Bản đồ Hà Nội"
            onConfirm={(loc) => {
              if (loc.district) setSelectedDistrict(loc.district);
              if (loc.ward) setSelectedWard(loc.ward);
              if (loc.street) setStreetAddress(loc.street);
              const newFull = loc.district
                ? formatHanoiAddress(loc.street, loc.ward, loc.district)
                : loc.fullAddress;
              setForm((prev) => ({ ...prev, address: newFull }));
              showToast?.("Đã cập nhật địa chỉ từ bản đồ!", "success");
            }}
          />
        </div>

        {/* Section 2.5: Đổi mật khẩu (Tùy chọn) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>🔐</span> Đổi mật khẩu đăng nhập
            </h3>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {showPasswordSection ? "Ẩn đổi mật khẩu" : "+ Đổi mật khẩu mới"}
            </button>
          </div>

          {showPasswordSection && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mật khẩu mới (Tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Dành riêng cho Nhân viên (Khu vực hoạt động + Ngân hàng nhận chuyển tiền) */}
        {isStaff && (
          <div className="pt-4 border-t border-slate-100 space-y-6">
            {/* 3.0 Kỹ năng & Chuyên môn */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🛠️</span> Dịch vụ &amp; Chuyên môn phụ trách
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Chọn các dịch vụ / hạng mục bạn có thể thực hiện:
              </p>

              {loadingServices ? (
                <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Đang tải danh mục dịch vụ...
                </div>
              ) : availableServices.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Chưa có dịch vụ nào trong hệ thống
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                  {availableServices.map((service) => {
                    const skillName = service.name;
                    const isSelected = currentSkills.includes(skillName);
                    return (
                      <button
                        key={service.id || skillName}
                        type="button"
                        onClick={() => toggleSkillTag(skillName)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left transition flex items-center justify-between border cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400"
                        }`}
                      >
                        <span className="truncate">{skillName}</span>
                        <span>{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentSkills.length > 0 && (
                <div className="mt-2 text-xs text-slate-600 break-words">
                  <span className="font-bold text-emerald-700">Đã chọn ({currentSkills.length} dịch vụ):</span>{" "}
                  {currentSkills.join(", ")}
                </div>
              )}
            </div>

            {/* 3.1 Khu vực hoạt động */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🎯</span> Khu vực phụ trách / nhận việc tại Hà Nội
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Chọn các Quận/Huyện bạn có thể di chuyển và thi công / khảo sát:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                {HANOI_DISTRICTS.map((d) => {
                  const isSelected = currentWorkingAreas.includes(d.name);
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => toggleWorkingDistrict(d.name)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold text-left transition flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400"
                      }`}
                    >
                      <span className="truncate">{d.name}</span>
                      <span>{isSelected ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>

              {currentWorkingAreas.length > 0 && (
                <div className="mt-2 text-xs text-slate-600 break-words">
                  <span className="font-bold text-emerald-700">Đã chọn ({currentWorkingAreas.length} khu vực):</span>{" "}
                  {currentWorkingAreas.join(", ")}
                </div>
              )}
            </div>

            {/* 3.2 Tài khoản ngân hàng */}
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>💳</span> Tài khoản ngân hàng (Admin chuyển tiền thù lao)
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Thông tin tài khoản chính chủ của bạn để Admin chuyển thù lao từng đơn hàng:
              </p>

              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">
                      Ngân hàng
                    </label>
                    <select
                      value={staffData.bankName}
                      onChange={(e) => setStaffData((p) => ({ ...p, bankName: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white font-medium focus:ring-2 focus:ring-blue-400 outline-none"
                    >
                      <option value="">-- Chọn ngân hàng --</option>
                      {VIETNAMESE_BANKS.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      value={staffData.bankAccountNumber}
                      onChange={(e) => setStaffData((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                      placeholder="VD: 0355880362"
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white font-mono tracking-wider focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-300 mb-1">
                      Chủ tài khoản (In hoa)
                    </label>
                    <input
                      type="text"
                      value={staffData.bankAccountName}
                      onChange={(e) => setStaffData((p) => ({ ...p, bankAccountName: e.target.value.toUpperCase() }))}
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white font-bold tracking-wider uppercase focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 flex items-center gap-2 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <span>🔒</span>
                  <span>
                    Thông tin được bảo mật và dùng cho việc chi trả thù lao từ quản trị viên.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-blue-600/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="animate-spin">🌀</span>
                <span>Đang lưu thông tin...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Lưu thay đổi hồ sơ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
