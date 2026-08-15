import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosConfig from '../util/AxiosConfig';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import NotificationPopover from '../components/NotificationPopover';
import Modal from '../components/Modal';

export default function Employee({ user, onLogout, showToast }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Tạo state local để quản lý thông tin profile mới nhất (đặc biệt là status)
  const [profile, setProfile] = useState(user);
  const [activeTab, setActiveTab] = useState('tasks');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [filterServiceId, setFilterServiceId] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // States cho Hợp đồng
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractForm, setContractForm] = useState({
    id: null,
    bookingId: null,
    contractCode: '',
    content: '',
    customerSigned: false,
    customerSignatureImg: '',
    workerSigned: false,
    workerSignatureImg: ''
  });

  const workerCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: ''
  });

  const handleMarkRead = async () => {
    if (notifications.some(n => !n.isRead)) {
      try {
        await AxiosConfig.put('/notifications/me/read');
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      } catch (error) {
        console.error("Lỗi cập nhật trạng thái thông báo:", error);
      }
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) return;
    try {
      await AxiosConfig.delete('/notifications/me');
      setNotifications([]);
      showToast("Đã xóa tất cả thông báo");
    } catch (error) {
      console.error("Lỗi xóa thông báo:", error);
    }
  };

  // Định nghĩa hàm xóa một thông báo cụ thể
  const handleDeleteNotification = async (id) => {
    try {
      await AxiosConfig.delete(`/notifications/me/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error("Lỗi xóa thông báo:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Tải thông tin cá nhân mới nhất để cập nhật trạng thái status (RESTRICTED/ACTIVE)
    const fetchProfile = async () => {
      try {
        const res = await AxiosConfig.get('/users/me');
        if (isMounted) {
          setProfile(res.data);
          setProfileForm({
            fullName: res.data.fullName || '',
            email: res.data.email || '',
            phoneNumber: res.data.phoneNumber || '',
            address: res.data.address || '',
            password: ''
          });
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái tài khoản:", error);
      }
    };

    // 2. Lấy danh sách nhiệm vụ từ Database
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // ✅ Sửa lỗi: Chỉ lấy nhiệm vụ được giao cho chính mình
        const res = await AxiosConfig.get('/bookings/technician');
        if (isMounted) {
          // Lọc chỉ hiện những đơn đã được Admin xác nhận (trạng thái khác PENDING)
          setTasks(res.data.filter(t => t.status !== 'PENDING'));
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách nhiệm vụ:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchServices = async () => {
      try {
        const res = await AxiosConfig.get('/services');
        if (isMounted) setServices(res.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách dịch vụ:", error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await AxiosConfig.get('/notifications/me');
        if (isMounted) setNotifications(res.data);
      } catch (error) {
        console.error("Lỗi khi tải thông báo:", error);
      }
    };

    const fetchContracts = async () => {
      try {
        const res = await AxiosConfig.get('/contracts');
        if (isMounted) setContracts(res.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách hợp đồng:", error);
      }
    };

    fetchProfile();
    fetchTasks();
    fetchServices();
    fetchContracts();
    fetchNotifications();

    return () => { isMounted = false; };
  }, [refreshTrigger]);

  // Xử lý Đăng xuất hệ thống (Sử dụng navigate để quay về trang login)
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      onLogout();
      showToast("Đăng xuất thành công!");
      navigate('/login');
    }
  };

  // Hàm hỗ trợ format ngày từ mảng [Y, M, D] sang chuỗi YYYY-MM-DD
  const formatDate = (dateInput) => {
    if (Array.isArray(dateInput)) {
      const [year, month, day] = dateInput;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return dateInput;
  };

  // Xử lý xóa nhiệm vụ
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) return;
    try {
      await AxiosConfig.delete(`/bookings/${id}`);
      // Cập nhật UI ngay lập tức mà không cần load lại trang
      setTasks(tasks.filter(t => t.id !== id));
      // Cập nhật chuông thông báo
      setRefreshTrigger(prev => prev + 1);
      showToast("Đã xóa yêu cầu thành công!");
    } catch (error) {
      console.error("Lỗi xóa nhiệm vụ:", error);
      showToast("Không thể xóa nhiệm vụ!", "error");
    }
  };

  // Cập nhật trạng thái công việc (Nhận việc -> Bắt đầu làm -> Hoàn thành)
  const handleStatusUpdate = async (taskId, currentStatus) => {
    if (profile?.status === 'RESTRICTED') {
      showToast("Tài khoản đã bị khóa!", "error");
      return;
    }

    try {
      let nextStatus;
      if (currentStatus === 'PENDING' || currentStatus === 'ASSIGNED') nextStatus = 'ACCEPTED';
      else if (currentStatus === 'ACCEPTED') {
        // Kiểm tra hợp đồng trước khi cho phép "Bắt đầu làm"
        const contract = contracts.find(c => c.bookingId === taskId);
        if (!contract) {
          showToast("Bạn phải lập hợp đồng khảo sát trước khi bắt đầu thi công!", "warning");
          return;
        }
        if (!contract.customerSigned) {
          showToast("Khách hàng chưa ký xác nhận hợp đồng này!", "warning");
          return;
        }
        nextStatus = 'PROCESSING';
      }
      else if (currentStatus === 'PROCESSING') nextStatus = 'COMPLETED';
      else return;

      const task = tasks.find(t => t.id === taskId);

      const formattedTime = task.appointmentTime
        ? (task.appointmentTime.length === 5 ? `${task.appointmentTime}:00` : task.appointmentTime)
        : "08:00:00";

      // ✅ Tạo payload chuẩn xác để tránh lỗi 400
      const payload = {
        id: Number(task.id),
        customerId: Number(task.customerId || task.customer?.id || 0),
        serviceId: Number(task.serviceId || task.service?.id || 0),
        technicianId: Number(profile.id),
        appointmentDate: formatDate(task.appointmentDate), // Đảm bảo gửi chuỗi YYYY-MM-DD
        appointmentTime: formattedTime,
        address: task.address || '',
        description: task.description || '',
        status: nextStatus
      };

      console.log("Dữ liệu gửi lên xác nhận:", payload);

      await AxiosConfig.put(`/bookings/${taskId}`, payload);

      // Cập nhật UI ngay lập tức
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      // Cập nhật chuông thông báo
      setRefreshTrigger(prev => prev + 1);
      showToast(`Đã chuyển trạng thái sang: ${nextStatus}`);
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      showToast("Lỗi cập nhật trạng thái!", "error");
    }
  };

  // Xử lý từ chối nhiệm vụ (Chuyển về PENDING và gỡ technicianId)
  const handleRefuseTask = async (taskId) => {
    if (!window.confirm("Bạn có chắc chắn muốn từ chối nhiệm vụ này không?")) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      const formattedTime = task.appointmentTime
        ? (task.appointmentTime.length === 5 ? `${task.appointmentTime}:00` : task.appointmentTime)
        : "08:00:00";

      const payload = {
        id: Number(task.id),
        customerId: Number(task.customerId || task.customer?.id || 0),
        serviceId: Number(task.serviceId || task.service?.id || 0),
        technicianId: null, // Gỡ bỏ gán thợ
        appointmentDate: formatDate(task.appointmentDate),
        appointmentTime: formattedTime,
        address: task.address || '',
        description: task.description || '',
        status: 'PENDING' // Quay về trạng thái chờ xử lý cho Admin
      };

      await AxiosConfig.put(`/bookings/${taskId}`, payload);

      // Cập nhật UI: Xóa khỏi danh sách nhiệm vụ hiện tại
      setTasks(tasks.filter(t => t.id !== taskId));
      // Cập nhật chuông thông báo
      setRefreshTrigger(prev => prev + 1);
      showToast("Đã từ chối nhiệm vụ thành công");
    } catch (error) {
      console.error("Lỗi từ chối nhiệm vụ:", error);
      showToast("Lỗi khi thực hiện từ chối!", "error");
    }
  };

  // Logic vẽ chữ ký nhân viên
  const startDrawing = (e) => {
    const canvas = workerCanvasRef.current;
    if (!canvas || contractForm.customerSigned) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = workerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const clearWorkerSignature = () => {
    const canvas = workerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Mở modal lập/sửa hợp đồng
  const handleOpenContractModal = async (task) => {
    setLoading(true);
    try {
      // Lấy thông tin khách hàng chi tiết (để lấy SĐT) và danh sách hợp đồng
      const [customerRes, contractsRes] = await Promise.all([
        AxiosConfig.get(`/users/${task.customerId || task.customer?.id}`),
        AxiosConfig.get('/contracts')
      ]);

      const customer = customerRes.data;
      const contract = contractsRes.data.find(c => c.bookingId === task.id);

      if (contract) {
        setContractForm(contract);
      } else {
        // Tạo nội dung hợp đồng mẫu (Template)
        const serviceName = services.find(s => s.id === task.serviceId)?.name || 'Dịch vụ sửa chữa';
        const contractTemplate = `HỢP ĐỒNG KHẢO SÁT & THI CÔNG SỬA CHỮA
Mã số: HD-${task.id}

BÊN A (KHÁCH HÀNG):
- Ông/Bà: ${customer.fullName || task.customerName || '................'}
- Điện thoại: ${customer.phoneNumber || '................'}
- Địa chỉ thi công: ${task.address || '................'}

BÊN B (ĐƠN VỊ THI CÔNG):
- Công ty Xây Dựng 247
- Đại diện: ${profile?.fullName || profile?.username || '................'}
- Số điện thoại: ${profile?.phoneNumber || '................'}

ĐIỀU 1: NỘI DUNG CÔNG VIỆC
Căn cứ vào khảo sát thực tế, hai bên thống nhất thực hiện hạng mục: ${serviceName.toUpperCase()}
Chi tiết công việc cụ thể:
- [Nhân viên nhập chi tiết các đầu việc tại đây...]

ĐIỀU 2: CHI PHÍ VÀ THANH TOÁN
- Tổng giá trị dự kiến: ................ VNĐ

ĐIỀU 3: THỜI GIAN THỰC HIỆN
- Ngày hẹn khảo sát: ${formatDate(task.appointmentDate)}
- Dự kiến hoàn thành: ................

ĐIỀU 4: CAM KẾT
- Bên thi công cam kết sử dụng vật tư đúng chủng loại và thi công đúng kỹ thuật.
- Bảo hành công trình trong vòng 12 tháng kể từ ngày nghiệm thu.`;

        setContractForm({
          id: null,
          bookingId: task.id,
          contractCode: `HD-${task.id}-${Date.now().toString().slice(-4)}`,
          content: contractTemplate,
          customerSigned: false,
          customerSignatureImg: '',
          workerSigned: false,
          workerSignatureImg: ''
        });
      }
      setIsContractModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi chuẩn bị hợp đồng:", error);
      showToast("Lỗi tải thông tin hợp đồng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();

    const canvas = workerCanvasRef.current;
    let payload = { ...contractForm };

    // Nếu không phải xem hợp đồng đã khóa, lấy chữ ký mới từ canvas
    if (!contractForm.customerSigned && canvas) {
      payload.workerSignatureImg = canvas.toDataURL("image/png");
      payload.workerSigned = true;
    }

    try {
      if (payload.id) {
        await AxiosConfig.put(`/contracts/${payload.id}`, payload);
        showToast("Cập nhật hợp đồng thành công!");
      } else {
        await AxiosConfig.post('/contracts', payload);
        showToast("Lập hợp đồng thành công!");
      }
      setIsContractModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      const msg = error.response?.status === 403 ? "Hợp đồng đã được khách ký, không thể sửa!" : "Lỗi lưu hợp đồng";
      showToast(msg, "error");
    }
  };

  // Xử lý cập nhật thông tin cá nhân
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Trích xuất danh sách ID kỹ năng từ thông tin profile hiện tại
      const currentSkillIds = profile.skills ? profile.skills.map(s => s.id || s) : [];

      const payload = {
        username: profile.username, // Bắt buộc gửi username để xác thực dữ liệu
        fullName: profileForm.fullName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        address: profileForm.address,
        status: profile.status || 'ACTIVE',
        roleId: profile.role?.id || 3, // Giữ nguyên phân quyền (thường là 3 cho Staff)
        skillIds: currentSkillIds,    // Gửi mảng ID thay vì mảng Object
        password: profileForm.password
      };

      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }

      const res = await AxiosConfig.put(`/users/${profile.id}`, payload);
      // Cập nhật lại state profile từ dữ liệu Backend trả về để đồng bộ giao diện
      setProfile(res.data);
      showToast("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      showToast("Lỗi cập nhật thông tin!", "error");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">

      {/* SIDEBAR DÙNG CHUNG */}
      <Sidebar
        logoIcon="W"
        logoTextPrimary="Kỹ Thuật"
        logoTextSecondary="247"
        color="amber"
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'tasks') setRefreshTrigger(p => p + 1);
        }}
        onLogout={handleLogout}
        menuItems={[
          { label: 'Nhiệm vụ của tôi', icon: '🛠️', value: 'tasks', badge: tasks.filter(t => t.status === 'ASSIGNED').length },
          { label: 'Thông tin cá nhân', icon: '👤', value: 'profile' }
        ]}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="flex justify-end mb-4">
          <NotificationPopover
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onDeleteAll={handleDeleteAllNotifications}
            onDeleteOne={handleDeleteNotification}
            color="amber"
          />
        </div>

        {/* THÔNG BÁO TÀI KHOẢN BỊ KHÓA (Hiển thị nổi bật ngay trên đầu nội dung) */}
        {profile?.status === 'RESTRICTED' && (
          <div className="mb-10 p-6 bg-rose-600 text-white rounded-3xl flex items-center justify-between gap-4 shadow-xl shadow-rose-500/20 animate-pulse">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🚫</span>
              <div>
                <h4 className="font-black text-xl leading-tight mb-1 uppercase">Tài khoản đang bị khóa</h4>
                <p className="text-rose-100 text-sm font-medium">Mọi tính năng nhận nhiệm vụ và cập nhật tiến độ đã bị tạm dừng. Vui lòng liên hệ Quản lý.</p>
              </div>
            </div>
            <button onClick={onLogout} className="bg-white/20 hover:bg-white/40 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0">ĐĂNG XUẤT</button>
          </div>
        )}

        <DashboardHeader
          title="Khu Vực Làm Việc"
          subtitle={`Xin chào, ${profile?.fullName || profile?.username}. Chúc bạn một ngày làm việc hiệu quả!`}
          userName={profile?.username}
          userRole={profile?.status === 'RESTRICTED' ? 'Tài khoản bị khóa' : 'Kỹ thuật viên'}
          avatarChar={(profile?.fullName || profile?.username || 'W').charAt(0).toUpperCase()}
          color="amber"
        />

        {activeTab === 'tasks' ? (
          <>
            {/* THỐNG KÊ NHANH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <StatCard
                label="Nhiệm vụ mới"
                value={tasks.filter(t => t.status === 'ASSIGNED').length}
              />
              <StatCard
                label="Đang thi công"
                value={tasks.filter(t => ['ACCEPTED', 'PROCESSING'].includes(t.status)).length}
                colorClass="text-blue-600"
                borderClass="border-l-4 border-l-blue-500"
              />
              <StatCard
                label="Đã xong"
                value={tasks.filter(t => t.status === 'COMPLETED').length}
                colorClass="text-emerald-600"
                borderClass="border-l-4 border-l-emerald-500"
              />
            </div>

            {/* THANH TÌM KIẾM NHIỆM VỤ */}
            <div className="mb-6 flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex-1 min-w-[200px] relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm theo tên khách hàng, địa chỉ hoặc mô tả..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hạng mục:</span>
                <select
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={filterServiceId}
                  onChange={(e) => setFilterServiceId(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lọc ngày:</span>
                <input
                  type="date"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
                <select
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>

                {(searchTerm || searchDate || filterServiceId || sortOrder !== 'desc') && (
                  <button onClick={() => { setSearchTerm(''); setSearchDate(''); setFilterServiceId(''); setSortOrder('desc'); }} className="text-xs font-bold text-rose-500 underline">Xóa lọc</button>
                )}
              </div>
            </div>

            {/* BẢNG NHIỆM VỤ */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Nhiệm vụ được phân công</h3>
                  <button
                    onClick={() => setRefreshTrigger(p => p + 1)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                    title="Tải lại danh sách"
                  >
                    🔄
                  </button>
                </div>
                {loading && <div className="text-xs text-slate-400 animate-pulse font-bold uppercase tracking-widest">Đang tải...</div>}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4">Mã Đơn</th>
                      <th className="px-6 py-4">Khách hàng / SĐT</th>
                      <th className="px-6 py-4">Hạng mục</th>
                      <th className="px-6 py-4">Thời gian / Địa chỉ</th>
                      <th className="px-6 py-4">Mô tả</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.length > 0 ? tasks
                      .filter(task => {
                        const matchesName = !searchTerm ||
                          (task.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (task.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesDate = !searchDate || formatDate(task.appointmentDate) === searchDate;
                        const matchesService = !filterServiceId || Number(task.serviceId) === Number(filterServiceId);
                        return matchesName && matchesDate && matchesService;
                      })
                      .sort((a, b) => {
                        const dateA = formatDate(a.appointmentDate);
                        const dateB = formatDate(b.appointmentDate);
                        return sortOrder === 'desc'
                          ? dateB.localeCompare(dateA)
                          : dateA.localeCompare(dateB);
                      })
                      .map((task) => (
                        <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-5 font-bold text-amber-600 text-sm">#{task.id}</td>
                          <td className="px-6 py-5 font-bold text-slate-900 text-sm">
                            <div className="flex flex-col">
                              <span>{task.customerName || `Khách hàng ID: ${task.customerId}`}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{task.customerPhone || 'Không có SĐT'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-slate-500 text-sm font-bold">
                            {services.find(s => s.id === task.serviceId)?.name || `DV #${task.serviceId}`}
                          </td>
                          <td className="px-6 py-5 text-slate-500 text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-900 font-bold">
                                {formatDate(task.appointmentDate)} <span className="text-blue-500/50">@ {task.appointmentTime}</span>
                              </span>
                              <span className="truncate max-w-[150px] italic text-slate-400" title={task.address}>{task.address}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-slate-400 text-xs italic max-w-[120px] truncate" title={task.description}>
                            {task.description}
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-6 py-5 text-right flex justify-end gap-2">
                            {task.status !== 'COMPLETED' && (
                              <div className="flex gap-2">
                                {(() => {
                                  const contract = contracts.find(c => c.bookingId === task.id);
                                  const isSigned = contract?.customerSigned;
                                  const isBiddingDisabled = profile?.status === 'RESTRICTED' || (task.status === 'ACCEPTED' && !isSigned);

                                  return (
                                    <button
                                      onClick={() => handleStatusUpdate(task.id, task.status)}
                                      disabled={isBiddingDisabled}
                                      className={`px-4 py-2 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 
                                      ${isBiddingDisabled
                                          ? 'bg-slate-300 cursor-not-allowed grayscale opacity-60'
                                          : (['PENDING', 'ASSIGNED'].includes(task.status) ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                                            : task.status === 'ACCEPTED' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                                              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20')
                                        }`}
                                    >
                                      {['PENDING', 'ASSIGNED'].includes(task.status) ? 'Xác nhận nhận việc'
                                        : task.status === 'ACCEPTED' ? 'Bắt đầu làm'
                                          : 'Xác nhận hoàn thành'}
                                    </button>
                                  );
                                })()}

                                {task.status === 'ASSIGNED' && (
                                  <button
                                    onClick={() => handleRefuseTask(task.id)}
                                    className="px-4 py-2 bg-rose-100 text-rose-600 text-xs font-black rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                  >
                                    Từ chối
                                  </button>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => handleOpenContractModal(task)}
                              className={`p-2 rounded-lg transition-all shadow-sm ${['ACCEPTED', 'PROCESSING', 'COMPLETED'].includes(task.status)
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                }`}
                              disabled={!['ACCEPTED', 'PROCESSING', 'COMPLETED'].includes(task.status)}
                              title="Lập hợp đồng khảo sát"
                            >
                              📜
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              title="Xóa nhiệm vụ"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-400 text-sm font-medium italic">Hiện chưa có nhiệm vụ nào được giao cho bạn.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* THÔNG TIN CÁ NHÂN */
          <div className="max-w-4xl">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-2xl">
                  {(profile?.fullName || profile?.username || 'W').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Thông tin hồ sơ</h3>
                  <p className="text-sm text-slate-400 font-medium">Cập nhật thông tin liên hệ và mật khẩu của bạn</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Họ và tên</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium"
                      value={profileForm.fullName}
                      onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Số điện thoại</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium"
                      value={profileForm.phoneNumber}
                      onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Mật khẩu mới (để trống nếu không đổi)</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium"
                      value={profileForm.password}
                      onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Địa chỉ</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium h-24 resize-none"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
              <div className="flex items-start gap-4">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="text-indigo-900 font-bold text-sm mb-1">Mẹo nhỏ</h4>
                  <p className="text-indigo-700/70 text-xs leading-relaxed">
                    Hãy đảm bảo số điện thoại của bạn luôn chính xác để khách hàng có thể liên lạc khi bạn đến khảo sát hoặc thi công công trình.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL LẬP HỢP ĐỒNG */}
        <Modal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          title={contractForm.customerSigned ? "Xem Hợp Đồng (Đã khóa chỉnh sửa)" : "Lập Hợp Đồng Khảo Sát & Thi Công"}
        >
          <form onSubmit={handleSaveContract} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mã hợp đồng (Tự động)</label>
              <input
                type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 font-bold"
                value={contractForm.contractCode} readOnly
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nội dung thỏa thuận</label>
              <textarea
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-amber-500 h-48 resize-none"
                placeholder="Nhập các điều khoản, báo giá sơ bộ và cam kết thi công..."
                value={contractForm.content}
                onChange={e => setContractForm({ ...contractForm, content: e.target.value })}
                disabled={contractForm.customerSigned}
                required
              />
            </div>

            {!contractForm.customerSigned && (
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Chữ ký của bạn (Kỹ thuật viên)</label>
                  <button type="button" onClick={clearWorkerSignature} className="text-[10px] text-rose-500 font-bold hover:underline">Xóa</button>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-white overflow-hidden">
                  <canvas
                    ref={workerCanvasRef} width={500} height={120}
                    onMouseDown={startDrawing} onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)}
                    className="w-full cursor-crosshair bg-slate-50/30"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
              {contractForm.workerSignatureImg && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-1">Chữ ký của bạn</label>
                  <div className="border border-blue-100 rounded-xl p-2 bg-white flex justify-center">
                    <img src={contractForm.workerSignatureImg} alt="Chữ ký thợ" className="max-h-24 object-contain" />
                  </div>
                </div>
              )}
              {contractForm.customerSignatureImg && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Chữ ký khách hàng</label>
                  <div className="border border-emerald-100 rounded-xl p-2 bg-white flex justify-center shadow-inner">
                    <img src={contractForm.customerSignatureImg} alt="Chữ ký khách" className="max-h-24 object-contain" />
                  </div>
                </div>
              )}
            </div>
            {contractForm.customerSigned && !contractForm.customerSignatureImg && (
              <div className="text-[10px] text-slate-400 italic px-1">Khách đã xác nhận nhưng không để lại chữ ký hình ảnh.</div>
            )}
            {contractForm.customerSigned ? (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
                <span>✅</span> Khách hàng đã ký xác nhận. Nội dung đã được niêm phong.
              </div>
            ) : (
              <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg">
                {contractForm.id ? 'Cập Nhật Hợp Đồng' : 'Gửi Hợp Đồng Cho Khách'}
              </button>
            )}
          </form>
        </Modal>
      </main>
    </div>
  );
}