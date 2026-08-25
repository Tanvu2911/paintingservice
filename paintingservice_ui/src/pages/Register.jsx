import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Paintbrush,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Home,
} from "lucide-react";
import AxiosConfig from "../util/AxiosConfig";
import { API_ENDPOINTS } from "../util/ApiEndpoints";

function Register({ showToast }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      showToast?.("Vui lòng điền đầy đủ các thông tin bắt buộc!", "warning");
      return;
    }

    if (password.length < 6) {
      showToast?.("Mật khẩu phải có độ dài tối thiểu từ 6 ký tự!", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showToast?.("Mật khẩu xác nhận không khớp!", "warning");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast?.("Địa chỉ email không đúng định dạng!", "warning");
      return;
    }

    try {
      setLoading(true);
      await AxiosConfig.post(API_ENDPOINTS.register, {
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      showToast?.(
        "Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.",
        "success"
      );
      navigate("/login");
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        "Đăng ký thất bại! Tên đăng nhập hoặc email có thể đã được sử dụng.";
      showToast?.(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Brand Hero Showcase (Dark Minimalist Slate) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient blur */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-slate-800/80 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <Link to="/home" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-emerald-500 transition-colors">
                <Paintbrush className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white leading-none block">
                  PAINTING<span className="text-emerald-400">247</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                  Dịch vụ sơn sửa chuyên nghiệp
                </span>
              </div>
            </Link>

            <div className="mt-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                Trải nghiệm dịch vụ <br />
                <span className="text-emerald-400">sơn sửa chuẩn 5 sao</span>.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tạo tài khoản để đặt lịch khảo sát miễn phí, theo dõi tiến độ thi công công trình và quản lý hợp đồng bảo hành trực tuyến.
              </p>
            </div>
          </div>

          {/* Middle Feature Highlights */}
          <div className="relative z-10 my-8 space-y-3.5">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span>Đặt lịch hẹn khảo sát chỉ với vài thao tác</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span>Báo giá minh bạch, hợp đồng điện tử ký số</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span>Cập nhật báo cáo ảnh tiến độ thi công mỗi ngày</span>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Bảo mật dữ liệu tuyệt đối</span>
            <Link to="/home" className="hover:text-white flex items-center gap-1 transition">
              <Home className="w-3.5 h-3.5" />
              Trang chủ
            </Link>
          </div>
        </div>

        {/* Right Side: Modern Register Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Header */}
            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Đăng ký tài khoản
              </h3>
              <p className="text-xs text-slate-500">
                Tạo tài khoản khách hàng mới để sử dụng dịch vụ Painting247
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập..."
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/20"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs text-slate-500">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-bold text-slate-900 hover:underline underline-offset-4"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;
