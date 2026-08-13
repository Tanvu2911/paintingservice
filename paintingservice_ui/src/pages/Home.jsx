import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AxiosConfig from "../util/AxiosConfig";
import StatusBadge from "../components/StatusBadge";
import NotificationPopover from "../components/NotificationPopover";
import Modal from "../components/Modal";

function Home({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [address, setAddress] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [appointmentTime, setAppointmentTime] = useState("08:00");
  const [loading, setLoading] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractBookingStatus, setContractBookingStatus] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await AxiosConfig.get("/services");
        setServices(res.data || []);
        if (res.data?.length > 0) setSelectedServiceId(res.data[0].id);
      } catch (error) {
        console.error("Lỗi tải danh sách dịch vụ:", error);
      }
    };

    const fetchTechnicians = async () => {
      try {
        const res = await AxiosConfig.get("/staff");
        const list = (res.data || []).filter(
          (s) =>
            (s.available === true || s.available == null) &&
            s.staffType !== "SUPERVISOR"
        );
        setTechnicians(list);
      } catch (error) {
        console.error("Lỗi tải danh sách kỹ thuật viên:", error);
      }
    };

    fetchServices();
    fetchTechnicians();

    if (user) {
      const fetchUserData = async () => {
        try {
          const profileRes = await AxiosConfig.get("/users/me");
          setProfile(profileRes.data);

          const bookingRes = await AxiosConfig.get("/bookings/me");
          setBookings(Array.isArray(bookingRes.data) ? bookingRes.data : []);

          const notiRes = await AxiosConfig.get("/notifications/me");
          setNotifications(Array.isArray(notiRes.data) ? notiRes.data : []);
        } catch (error) {
          console.error("Lỗi cập nhật profile:", error);
        }
      };
      fetchUserData();
    }
  }, [user, refreshTrigger]);

  const formatDate = (dateInput) => {
    if (Array.isArray(dateInput)) {
      const [year, month, day] = dateInput;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return dateInput || "";
  };

  const formatTime = (timeInput) => {
    if (!timeInput) return "08:00:00";
    return timeInput.length === 5 ? `${timeInput}:00` : timeInput;
  };

  const handleMarkRead = async () => {
    if (notifications.some((n) => !n.isRead)) {
      try {
        await AxiosConfig.put("/notifications/me/read");
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      } catch (error) {
        console.error("Lỗi cập nhật trạng thái thông báo:", error);
      }
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) return;
    try {
      await AxiosConfig.delete("/notifications/me");
      setNotifications([]);
      showToast("Đã xóa tất cả thông báo");
    } catch (error) {
      console.error("Lỗi xóa thông báo:", error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await AxiosConfig.delete(`/notifications/me/${id}`);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Lỗi xóa thông báo:", error);
    }
  };

  const handleResetForm = () => {
    setEditingBookingId(null);
    if (services.length > 0) setSelectedServiceId(services[0].id);
    setSelectedTechnicianId("");
    setNewDesc("");
    setAddress("");
    setAppointmentDate(new Date().toISOString().split("T")[0]);
    setAppointmentTime("08:00");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (profile?.status === "RESTRICTED") {
      showToast("Tài khoản đã bị khóa!", "error");
      return;
    }
    if (
      !newDesc.trim() ||
      !address.trim() ||
      !selectedServiceId ||
      !appointmentDate ||
      !appointmentTime
    ) {
      showToast("Vui lòng nhập đủ thông tin!", "warning");
      return;
    }
    if (!profile?.id) {
      showToast("Dữ liệu chưa tải xong!", "warning");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerId: Number(profile.id),
        serviceId: Number(selectedServiceId),
        preferredTechnicianId: selectedTechnicianId
          ? Number(selectedTechnicianId)
          : null,
        appointmentDate,
        appointmentTime: formatTime(appointmentTime),
        address,
        description: newDesc,
        status: "PENDING",
      };

      if (editingBookingId) {
        await AxiosConfig.put(`/bookings/${editingBookingId}`, payload);
        setEditingBookingId(null);
        showToast("Cập nhật yêu cầu thành công!");
      } else {
        await AxiosConfig.post("/bookings", payload);
        showToast("Gửi yêu cầu thành công!");
      }

      setRefreshTrigger((prev) => prev + 1);
      handleResetForm();
    } catch (error) {
      console.error("Lỗi gửi yêu cầu:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join(", ") ||
        "Không thể gửi yêu cầu. Vui lòng thử lại!";
      showToast("Lỗi: " + errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) return;
    try {
      await AxiosConfig.delete(`/bookings/${id}`);
      setBookings(bookings.filter((b) => b.id !== id));
      setRefreshTrigger((prev) => prev + 1);
      if (editingBookingId === id) handleResetForm();
      showToast("Đã xóa yêu cầu thành công!");
    } catch (error) {
      console.error("Lỗi xóa yêu cầu:", error);
      showToast("Không thể xóa yêu cầu!", "error");
    }
  };

  const handleEditRequest = (req) => {
    setEditingBookingId(req.id);
    setSelectedServiceId(req.serviceId);
    setSelectedTechnicianId(
      req.preferredTechnicianId || req.technicianId || ""
    );
    setNewDesc(req.description || "");
    setAddress(req.address || "");
    setAppointmentDate(formatDate(req.appointmentDate) || "");
    setAppointmentTime(
      (req.appointmentTime || "").toString().slice(0, 5) || "08:00"
    );
    window.scrollTo({
      top: document.getElementById("booking")?.offsetTop - 100 || 0,
      behavior: "smooth",
    });
  };

  const handleCustomerAccept = async (bookingId) => {
    if (
      !window.confirm(
        "Xác nhận nghiệm thu công trình?\nChỉ khi cả Giám sát cũng xác nhận thì đơn mới hoàn tất."
      )
    )
      return;
    try {
      const detailsResponse = await AxiosConfig.get(`/booking-details/booking/${bookingId}`);
      const details = Array.isArray(detailsResponse.data) ? detailsResponse.data : [];
      if (!details.length) {
        throw new Error("Don hang chua co hang muc de nghiem thu");
      }
      await Promise.all(
        details
          .filter((detail) => !detail.customerAccepted)
          .map((detail) => AxiosConfig.post(`/booking-details/${detail.id}/customer-accept`))
      );
      showToast("Đã xác nhận nghiệm thu thành công!");
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Không thể xác nhận nghiệm thu",
        "error"
      );
    }
  };

  const handleViewContract = async (booking) => {
    try {
      const res = await AxiosConfig.get("/contracts");
      const list = Array.isArray(res.data) ? res.data : [];
      const contract = list.find(
        (c) => Number(c.bookingId) === Number(booking.id)
      );

      if (contract) {
        setSelectedContract(contract);
        setContractBookingStatus(booking.status);
        setIsContractModalOpen(true);
        setTimeout(() => clearSignature(), 80);
      } else {
        showToast(
          ["WAITING_CONTRACT_APPROVAL", "CONTRACT_APPROVED"].includes(
            booking.status
          )
            ? "Chưa tìm thấy hợp đồng. Vui lòng thử lại sau."
            : "Chưa có hợp đồng cho yêu cầu này.",
          "info"
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Lỗi tải thông tin hợp đồng", "error");
    }
  };

  const closeContractModal = () => {
    setIsContractModalOpen(false);
    setSelectedContract(null);
    setContractBookingStatus(null);
    setIsDrawing(false);
  };

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirmContract = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedContract?.id) return;

    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasInk = pixels.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasInk) {
      showToast("Vui lòng ký tên trước khi xác nhận!", "warning");
      return;
    }

    const signatureBase64 = canvas.toDataURL("image/png");

    try {
      const payload = {
        id: selectedContract.id,
        bookingId: selectedContract.bookingId,
        contractCode: selectedContract.contractCode,
        content: selectedContract.content,
        customerSigned: true,
        customerSignatureImg: signatureBase64,
        workerSigned: selectedContract.workerSigned ?? false,
        workerSignatureImg: selectedContract.workerSignatureImg ?? null,
      };

      await AxiosConfig.put(`/contracts/${selectedContract.id}`, payload);

      showToast("Xác nhận hợp đồng thành công!");
      closeContractModal();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.messages?.join?.(", ") ||
        "Lỗi xác nhận hợp đồng";
      showToast(msg, "error");
    }
  };

  const canSignContract =
    selectedContract &&
    !selectedContract.customerSigned &&
    contractBookingStatus === "WAITING_CUSTOMER_SIGNATURE";

  const isWaitingAdminApproval =
    selectedContract &&
    !selectedContract.customerSigned &&
    contractBookingStatus === "WAITING_CONTRACT_APPROVAL";

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 antialiased font-sans">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 px-4 py-4 sm:px-8 lg:px-16 flex justify-between items-center shadow-sm">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-blue-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">
            Xây Dựng <span className="text-blue-600">247</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#services" className="hover:text-blue-600 transition-colors">
            Dịch vụ
          </a>
          <a href="#workflow" className="hover:text-blue-600 transition-colors">
            Quy trình
          </a>
          <a href="#booking" className="hover:text-blue-600 transition-colors">
            Đặt lịch khảo sát
          </a>
        </nav>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <NotificationPopover
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onDeleteAll={handleDeleteAllNotifications}
                onDeleteOne={handleDeleteNotification}
                color="blue"
              />
              <div className="hidden sm:block text-right">
                <div className="text-xs text-slate-400">Xin chào,</div>
                <div className="text-sm font-bold text-slate-800">
                  {user.username}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-all cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </header>

      {profile?.status === "RESTRICTED" && (
        <div className="max-w-4xl mx-auto mt-8 px-4">
          <div className="p-6 bg-rose-50 border-l-4 border-rose-500 rounded-2xl flex items-center gap-4 shadow-sm">
            <span className="text-3xl">🚫</span>
            <div>
              <h4 className="text-rose-800 font-black text-lg">
                Tài khoản của bạn hiện đang bị khóa
              </h4>
              <p className="text-rose-600 text-sm font-medium">
                Bạn hiện không thể gửi yêu cầu khảo sát mới. Vui lòng liên hệ
                tổng đài hỗ trợ.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white pt-24 pb-24 px-4 text-center max-w-5xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100/50 text-blue-600 border border-blue-200/50 mb-8">
          ✨ Giải pháp sửa chữa nhà trọn gói uy tín hàng đầu
        </span>
        <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
          Làm Mới <span className="text-orange-500">Tổ Ấm</span>{" "}
          <br className="hidden sm:inline" />
          Bằng Sự{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Tâm Huyết
          </span>
        </h2>
        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Đội ngũ thợ lành nghề giàu kinh nghiệm, khảo sát hiện trạng miễn phí,
          báo giá minh bạch vật tư từng hạng mục và cam kết không phát sinh chi
          phí.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="#booking"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/20 transition-all"
          >
            Đặt Lịch Khảo Sát Miễn Phí
          </a>
          <a
            href="#services"
            className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-xl text-sm transition-all"
          >
            Xem Các Hạng Mục
          </a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto -mt-8 mb-20 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-md md:divide-x divide-slate-100">
          {[
            { value: "1,200+", label: "Công trình hoàn thành" },
            { value: "45+", label: "Thợ thâm niên cao" },
            { value: "100%", label: "Vật liệu chính hãng" },
            { value: "5 Năm", label: "Bảo hành kết cấu" },
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-2 md:p-0">
              <div className="text-2xl sm:text-3xl font-black text-blue-600 mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="services"
        className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-xl mx-auto mb-12">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
            Dịch Vụ Chuyên Sâu Của Chúng Tôi
          </h3>
          <p className="text-sm text-slate-400">
            Đáp ứng mọi nhu cầu sửa chữa từ dặm vá nhỏ lẻ đến cải tạo kết cấu
            phức tạp toàn diện căn nhà.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv, idx) => (
            <div
              key={srv.id || idx}
              className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-500/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-slate-50 text-2xl rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                {["🧱", "🎨", "⚡", "🪟", "🪵", "🛡️"][idx % 6]}
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                {srv.name}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {srv.description || "Chưa có mô tả chi tiết cho dịch vụ này."}
              </p>
              <div className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-widest">
                Từ {srv.basePrice?.toLocaleString()} VNĐ
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="booking"
        className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 mt-12"
      >
        {user ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span>📋</span>{" "}
                {editingBookingId
                  ? "Chỉnh Sửa Yêu Cầu"
                  : "Đăng Ký Khảo Sát Hiện Trạng"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Hạng mục cần cải tạo
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-1">
                    Lựa chọn đội ngũ thi công
                  </label>
                  <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-2">
                    <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-2 p-1">
                      <div
                        onClick={() => setSelectedTechnicianId("")}
                        className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                          selectedTechnicianId === ""
                            ? "border-blue-600 bg-white shadow-md"
                            : "border-slate-100 bg-white hover:border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-2xl shadow-inner">
                          🤖
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-black text-slate-900">
                            Hệ thống tự động điều phối
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Kỹ sư phù hợp nhất sẽ được chỉ định
                          </div>
                        </div>
                      </div>

                      {technicians.map((tech) => {
                        const techUserId = tech.userId ?? tech.id;
                        const selected =
                          String(selectedTechnicianId) === String(techUserId);
                        return (
                          <div
                            key={techUserId}
                            onClick={() =>
                              setSelectedTechnicianId(String(techUserId))
                            }
                            className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all flex items-center gap-4 group ${
                              selected
                                ? "border-blue-600 bg-white shadow-md"
                                : "border-slate-100 bg-white hover:border-blue-200 shadow-sm"
                            }`}
                          >
                            <div
                              className={`w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl shadow-inner shrink-0 ${
                                selected
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                              }`}
                            >
                              {(tech.username || "T").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-black text-slate-900">
                                {tech.username}
                              </div>
                              <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase inline-block mt-1">
                                {tech.specialty || "Thợ thi công"}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1">
                                📞 {tech.phoneNumber || "09xx-xxx-xxx"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Ngày hẹn khảo sát
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Giờ hẹn mong muốn
                    </label>
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Địa chỉ công trình
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Số 29, Ngõ 11, Quận Cầu Giấy, Hà Nội"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Mô tả hiện trạng & Yêu cầu cụ thể
                  </label>
                  <textarea
                    placeholder="Mô tả hiện trạng, yêu cầu sửa chữa..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-28 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={profile?.status === "RESTRICTED" || loading}
                    className={`flex-1 py-2.5 text-white font-bold rounded-lg text-sm shadow-sm transition-all ${
                      profile?.status === "RESTRICTED" || loading
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading
                      ? "Đang xử lý..."
                      : editingBookingId
                      ? "Cập Nhật Ngay"
                      : "Gửi Yêu Cầu"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-sm"
                  >
                    Làm mới
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span>🏗️</span> Tiến Độ Công Trình Của Bạn
              </h3>

              <div className="mb-4 flex flex-wrap gap-2 items-center">
                <div className="flex-1 min-w-[150px] relative">
                  <input
                    type="text"
                    placeholder="Tìm theo hạng mục, mô tả..."
                    className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]">
                    🔍
                  </span>
                </div>
                <input
                  type="date"
                  className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-[10px] text-slate-400">→</span>
                <input
                  type="date"
                  className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <select
                  className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold tracking-wide uppercase">
                      <th className="pb-3 pl-2">Mã</th>
                      <th className="pb-3">Thời gian / Nhân sự</th>
                      <th className="pb-3">Địa chỉ & Mô tả</th>
                      <th className="pb-3 pr-2 text-right">
                        Trạng thái & Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70">
                    {bookings
                      .filter((req) => {
                        const srvName =
                          services.find((s) => s.id === req.serviceId)?.name ||
                          "";
                        const matchesName =
                          !searchTerm ||
                          srvName
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          (req.description || "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());
                        const reqDate = formatDate(req.appointmentDate);
                        const matchesStart = !startDate || reqDate >= startDate;
                        const matchesEnd = !endDate || reqDate <= endDate;
                        return matchesName && matchesStart && matchesEnd;
                      })
                      .sort((a, b) => {
                        const dateA = formatDate(a.appointmentDate);
                        const dateB = formatDate(b.appointmentDate);
                        return sortOrder === "desc"
                          ? dateB.localeCompare(dateA)
                          : dateA.localeCompare(dateB);
                      })
                      .map((req) => (
                        <tr
                          key={req.id}
                          className="text-sm text-slate-600 hover:bg-slate-50/40 transition-colors"
                        >
                          <td className="py-4 pl-2 font-bold text-blue-600">
                            #{req.id}
                          </td>
                          <td className="py-4 font-semibold text-slate-800">
                            <div className="flex flex-col">
                              <span>
                                {formatDate(req.appointmentDate)} |{" "}
                                {req.appointmentTime}
                              </span>
                              <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tight">
                                {req.preferredTechnicianName ||
                                  req.technicianName ||
                                  technicians.find(
                                    (t) =>
                                      t.id === req.preferredTechnicianId ||
                                      t.userId === req.preferredTechnicianId ||
                                      t.id === req.technicianId
                                  )?.username ||
                                  "Đang chờ phân công"}
                              </span>
                            </div>
                          </td>
                          <td
                            className="py-4 max-w-[260px] truncate text-slate-500"
                            title={`${req.address} - ${req.description}`}
                          >
                            <span className="font-bold text-slate-700">
                              {req.address}
                            </span>
                            : {req.description}
                          </td>
                          <td className="py-4 pr-2 text-right">
                            <div className="flex flex-col items-end gap-2">
                              <StatusBadge status={req.status} />
                              <div className="flex gap-3 flex-wrap justify-end">
                                <button
                                  onClick={() =>
                                    navigate(`/customer/bookings/${req.id}`)
                                  }
                                  className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer uppercase"
                                >
                                  Xem chi tiết
                                </button>

                                {req.status === "PENDING" && (
                                  <>
                                    <button
                                      onClick={() => handleEditRequest(req)}
                                      className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer uppercase"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteRequest(req.id)
                                      }
                                      className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer uppercase"
                                    >
                                      Xóa
                                    </button>
                                  </>
                                )}

                                {req.status === "WORKER_COMPLETED" &&
                                  !req.customerAccepted && (
                                    <button
                                      onClick={() =>
                                        handleCustomerAccept(req.id)
                                      }
                                      className="text-[10px] font-black text-purple-600 hover:underline cursor-pointer uppercase"
                                    >
                                      Nghiệm thu
                                    </button>
                                  )}

                                {req.status === "WORKER_COMPLETED" &&
                                  req.customerAccepted && (
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">
                                      Đã nghiệm thu ✓
                                    </span>
                                  )}

                                {[
                                  "WAITING_CONTRACT_APPROVAL",
                                  "WAITING_CUSTOMER_SIGNATURE",
                                  "ASSIGNED",
                                  "PROCESSING",
                                  "WORKER_COMPLETED",
                                  "COMPLETED",
                                ].includes(req.status) && (
                                  <button
                                    onClick={() => handleViewContract(req)}
                                    className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer uppercase italic"
                                  >
                                    {req.status ===
                                    "WAITING_CUSTOMER_SIGNATURE"
                                      ? "📜 Ký hợp đồng"
                                      : "📜 Hợp đồng"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/60 shadow-xs">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 text-2xl rounded-xl flex items-center justify-center mx-auto mb-4">
              🏠
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Đăng ký khảo sát công trình trực tuyến
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Vui lòng đăng nhập để quản lý yêu cầu và ký hợp đồng điện tử.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm"
              >
                Đăng Nhập Ngay
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-sm"
              >
                Đăng Ký Tài Khoản Mới
              </button>
            </div>
          </div>
        )}
      </section>

      <Modal
        isOpen={isContractModalOpen}
        onClose={closeContractModal}
        title="Chi Tiết Hợp Đồng Sửa Chữa"
      >
        {selectedContract && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Mã: {selectedContract.contractCode}</span>
              <span
                className={
                  selectedContract.customerSigned
                    ? "text-emerald-600"
                    : "text-amber-500"
                }
              >
                {selectedContract.customerSigned
                  ? "Đã ký"
                  : contractBookingStatus === "WAITING_CONTRACT_APPROVAL"
                  ? "Chờ Admin duyệt"
                  : contractBookingStatus === "WAITING_CUSTOMER_SIGNATURE"
                  ? "Mời bạn ký hợp đồng"
                  : ""}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[160px] max-h-[280px] overflow-y-auto">
              {selectedContract.content || "Chưa có nội dung"}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedContract.workerSignatureImg && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">
                    Chữ ký Giám sát / Thợ
                  </label>
                  <div className="border border-blue-100 rounded-2xl bg-white p-4 flex justify-center shadow-inner">
                    <img
                      src={selectedContract.workerSignatureImg}
                      alt="Chữ ký thợ"
                      className="max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}
              {selectedContract.customerSigned &&
                selectedContract.customerSignatureImg && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">
                      Chữ ký của bạn
                    </label>
                    <div className="border border-emerald-100 rounded-2xl p-4 bg-white flex justify-center shadow-inner">
                      <img
                        src={selectedContract.customerSignatureImg}
                        alt="Chữ ký khách"
                        className="max-h-32 object-contain"
                      />
                    </div>
                  </div>
                )}
            </div>

            {isWaitingAdminApproval && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Hợp đồng đang chờ <strong>Admin duyệt</strong>. Bạn sẽ ký sau
                khi được duyệt.
              </div>
            )}

            {canSignContract && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Ký tên xác nhận tại đây
                    </label>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[10px] text-rose-500 font-bold hover:underline"
                    >
                      Xóa chữ ký
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-white overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      className="w-full cursor-crosshair touch-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmContract}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Xác Nhận & Ký Hợp Đồng
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-slate-300 mb-1 text-sm">
              Hệ thống Sửa Chữa & Cải Tạo Nhà Trọn Gói Xây Dựng 247
            </p>
            <p>Hotline hỗ trợ kỹ thuật gấp: 1900.xxxx</p>
          </div>
          <div className="text-slate-500">
            &copy; {new Date().getFullYear()} Xây Dựng 247. Toàn bộ bản quyền
            được bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
