import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Map,
  Lock,
  Wrench,
  Compass,
  CreditCard,
  ShieldCheck,
  Save,
  Loader2,
  Check,
  Plus,
  FileText,
  Info,
  Camera,
} from "lucide-react";
import AxiosConfig from "../../util/AxiosConfig";
import AddressMapModal from "./AddressMapModal";
import {
  HANOI_DISTRICTS,
  VIETNAMESE_BANKS,
  getMatchingBankValue,
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
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Initialize data from user
  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || user.phone || "",
        address: user.address || "",
      });
      if (user.avatar) {
        setAvatar(user.avatar);
      }

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
            if (res.data.avatar) {
              setAvatar(res.data.avatar);
            }
            setStaffData({
              serviceArea: res.data.serviceArea || "",
              bankName: getMatchingBankValue(res.data.bankName) || "",
              bankAccountNumber: res.data.bankAccountNumber || "",
              bankAccountName: res.data.bankAccountName || res.data.bankAccountHolder || "",
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
      } catch (e) { }

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast?.("Vui lòng chọn tệp hình ảnh!", "warning");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploadingAvatar(true);
    try {
      const res = await AxiosConfig.post("/staff/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newAvatar = res.data?.avatar;
      if (newAvatar) {
        setAvatar(newAvatar);
        try {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            localStorage.setItem("user", JSON.stringify({ ...parsed, avatar: newAvatar }));
          }
        } catch (err) {}
        showToast?.("Cập nhật ảnh đại diện thành công!", "success");
      }
    } catch (err) {
      showToast?.(err.response?.data?.message || "Tải ảnh đại diện thất bại", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const districtObj = HANOI_DISTRICTS.find((d) => d.name === selectedDistrict);
  const currentWorkingAreas = staffData.serviceArea ? staffData.serviceArea.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const currentSkills = staffData.specialty ? staffData.specialty.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Info Banner */}
      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {avatar ? (
              <img
                src={avatar}
                alt={user?.fullName || user?.username}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-md border-2 border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md shadow-blue-600/20 shrink-0">
                {(user?.fullName || user?.username || "U").charAt(0).toUpperCase()}
              </div>
            )}

            <label className="absolute inset-0 bg-black/40 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Đổi ảnh</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {user?.fullName || user?.username || "Tài khoản cá nhân"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                {roleLabel}
              </span>
              <span className="text-xs text-slate-400 font-medium">Mã tài khoản: #{user?.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-blue-600/20 active:scale-98 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tóm tắt & Đổi mật khẩu (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Profile Card */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Thông tin tổng quan</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Tên đăng nhập:</span>
                  <span className="font-bold text-slate-800 font-mono">{form.username || "—"}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Số điện thoại:</span>
                  <span className="font-bold text-slate-800">{form.phoneNumber || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-semibold">Email:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[170px]" title={form.email}>
                    {form.email || "Chưa cập nhật"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400 font-semibold">Vai trò:</span>
                  <span className="font-bold text-blue-700">{roleLabel}</span>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Đổi mật khẩu</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {showPasswordSection ? "Ẩn" : "+ Đổi mật khẩu"}
                </button>
              </div>

              {showPasswordSection ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Mật khẩu mới (Tối thiểu 6 ký tự)
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Mật khẩu mới sẽ được cập nhật cùng lúc khi bạn bấm Lưu thay đổi.</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Nhấn vào nút đổi mật khẩu để cập nhật mật khẩu đăng nhập của tài khoản.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Chi tiết Thông tin, Địa chỉ & Staff Specifics (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Basic Info Card */}
            <div className="bg-white p-5 sm:p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-slate-500" />
                <span>Thông tin tài khoản &amp; Liên hệ</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="VD: 0987654321"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* 2. Hanoi Address Card */}
            <div className="bg-white p-5 sm:p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Địa chỉ khu vực Hà Nội</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMapModalOpen(true)}
                    className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Map className="w-3.5 h-3.5 text-slate-600" />
                    <span>Chọn trên Bản đồ Hà Nội</span>
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    Hà Nội
                  </span>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Chọn Quận / Huyện (Hà Nội) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={handleDistrictChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
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
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 transition"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* Live Address Preview & Map Quick Open */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs break-words flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-slate-400 font-semibold text-[11px]">Địa chỉ hiển thị đầy đủ:</span>{" "}
                    <span className="font-bold text-slate-800 text-xs sm:text-[13px] block mt-0.5">
                      {selectedDistrict
                        ? formatHanoiAddress(streetAddress, selectedWard, selectedDistrict)
                        : form.address || "Chưa thiết lập địa chỉ"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapModalOpen(true)}
                    className="text-slate-700 hover:text-slate-900 font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mở bản đồ</span>
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

            {/* Staff-only sections */}
            {isStaff && (
              <>
                {/* 3. Services & Specialties */}
                <div className="bg-white p-5 sm:p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-500" />
                        <span>Dịch vụ &amp; Chuyên môn phụ trách</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chọn các dịch vụ bạn có chuyên môn thi công / khảo sát:
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                      {currentSkills.length} đã chọn
                    </span>
                  </div>

                  {loadingServices ? (
                    <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                      Đang tải danh mục dịch vụ...
                    </div>
                  ) : availableServices.length === 0 ? (
                    <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                      Chưa có dịch vụ nào trong hệ thống
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 max-h-60 overflow-y-auto">
                      {availableServices.map((service) => {
                        const skillName = service.name;
                        const isSelected = currentSkills.includes(skillName);
                        return (
                          <button
                            key={service.id || skillName}
                            type="button"
                            onClick={() => toggleSkillTag(skillName)}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center justify-between gap-2 border cursor-pointer ${isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                              }`}
                          >
                            <span className="truncate">{skillName}</span>
                            <span className={`shrink-0 text-xs font-black ${isSelected ? "text-white" : "text-slate-400"}`}>
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentSkills.length > 0 && (
                    <div className="text-xs text-slate-600 break-words bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Dịch vụ đã chọn:</span>{" "}
                      <span className="text-slate-700">{currentSkills.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* 4. Hanoi Working Districts */}
                <div className="bg-white p-5 sm:p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Compass className="w-4 h-4 text-slate-500" />
                        <span>Khu vực phụ trách / nhận việc tại Hà Nội</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chọn các Quận/Huyện bạn có thể di chuyển để làm việc:
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                      {currentWorkingAreas.length} quận/huyện
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 max-h-60 overflow-y-auto">
                    {HANOI_DISTRICTS.map((d) => {
                      const isSelected = currentWorkingAreas.includes(d.name);
                      return (
                        <button
                          key={d.name}
                          type="button"
                          onClick={() => toggleWorkingDistrict(d.name)}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center justify-between gap-1.5 border cursor-pointer ${isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                        >
                          <span className="truncate">{d.name}</span>
                          <span className={`shrink-0 text-xs font-black ${isSelected ? "text-white" : "text-slate-400"}`}>
                            {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {currentWorkingAreas.length > 0 && (
                    <div className="text-xs text-slate-600 break-words bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800">Khu vực đã chọn:</span>{" "}
                      <span className="text-slate-700">{currentWorkingAreas.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* 5. Bank Account for Admin Direct Payouts */}
                <div className="bg-white p-5 sm:p-6 md:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      <span>Tài khoản ngân hàng nhận thù lao (Admin chuyển khoản trực tiếp)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thông tin tài khoản chính chủ của bạn để Quản trị viên (Admin) chuyển khoản thù lao theo từng đơn hàng:
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                          Ngân hàng
                        </label>
                        <select
                          value={getMatchingBankValue(staffData.bankName)}
                          onChange={(e) => setStaffData((p) => ({ ...p, bankName: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="">-- Chọn ngân hàng --</option>
                          {staffData.bankName && !VIETNAMESE_BANKS.some((b) => b.name === getMatchingBankValue(staffData.bankName)) && (
                            <option value={staffData.bankName}>{staffData.bankName}</option>
                          )}
                          {VIETNAMESE_BANKS.map((b) => (
                            <option key={b.code} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                          Số tài khoản
                        </label>
                        <input
                          type="text"
                          value={staffData.bankAccountNumber || ""}
                          onChange={(e) => setStaffData((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                          placeholder="VD: 0355880362"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                          Chủ tài khoản (viết hoa)
                        </label>
                        <input
                          type="text"
                          value={staffData.bankAccountName || staffData.bankAccountHolder || ""}
                          onChange={(e) =>
                            setStaffData((p) => ({
                              ...p,
                              bankAccountName: e.target.value.toUpperCase(),
                              bankAccountHolder: e.target.value.toUpperCase(),
                            }))
                          }
                          placeholder="VD: NGUYEN VAN A"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold tracking-wider uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-[11.5px] text-slate-300 flex items-center gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                      <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        Hệ thống đối soát thù lao tự động. Admin sẽ chuyển khoản trực tiếp vào tài khoản này sau khi đơn hàng hoàn tất. Bạn không cần làm lệnh rút tiền thủ công.
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Bottom Save Button Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Hãy kiểm tra kỹ thông tin liên hệ và số tài khoản ngân hàng trước khi lưu.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition shadow-md shadow-blue-600/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu thay đổi...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi hồ sơ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
