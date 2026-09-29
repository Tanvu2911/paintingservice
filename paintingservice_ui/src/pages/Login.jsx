import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Paintbrush,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Home,
  Sparkles,
} from "lucide-react";
import AxiosConfig from "../util/AxiosConfig";
import { API_ENDPOINTS } from "../util/ApiEndpoints";
import { getRedirectPath } from "../util/roleUtils";

function Login({ onLogin, showToast }) {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !password.trim()) {
      showToast?.("Vui lòng điền đầy đủ email và mật khẩu!", "warning");
      return;
    }

    if (!loginInput.includes("@")) {
      showToast?.("Vui lòng nhập đúng định dạng Email (ví dụ: admin@suachua247.com)!", "warning");
      return;
    }

    try {
      setLoading(true);
      const response = await AxiosConfig.post(API_ENDPOINTS.login, {
        email: loginInput.trim(),
        password: password.trim(),
      });

      const resData = response.data?.data || response.data;
      const token = resData.token || resData.accessToken;
      if (token) localStorage.setItem("token", token);

      onLogin(resData);
      showToast?.(
        `Đăng nhập thành công! Chào mừng ${resData.fullName || resData.username || resData.email}`,
        "success"
      );

      const targetPath = location.state?.redirectTo || getRedirectPath(resData);
      navigate(targetPath, {
        state: {
          serviceId: location.state?.serviceId,
          serviceName: location.state?.serviceName,
        },
        replace: true,
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const data = error.response?.data;
      const msg =
        data?.message ||
        (Array.isArray(data?.messages) ? data.messages.join(", ") : null) ||
        data?.error ||
        (typeof data === "string" ? data : null) ||
        "Đăng nhập thất bại! Vui lòng kiểm tra lại email hoặc mật khẩu.";
      showToast?.(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (identifier, p) => {
    setLoginInput(identifier);
    setPassword(p);
    showToast?.(`Đã điền tài khoản: ${identifier}`, "info");
  };

  const demoAccounts = [
    { role: "Quản trị viên (Admin)", identifier: "admin@suachua247.com", pass: "123456" },
    { role: "Giám sát viên (Survey)", identifier: "survey1", pass: "123456" },
    { role: "Kỹ thuật thi công (Technician)", identifier: "technician1", pass: "123456" },
    { role: "Khách hàng (Customer)", identifier: "customer1", pass: "123456" },
  ];

  return (
    <div className="relative min-h-screen bg-[#070B14] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* 1. Atmospheric Photographic & Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle architectural painting background */}
        <img
          src="/hero-luxury.jpg"
          alt="Architectural Backdrop"
          className="w-full h-full object-cover object-center filter blur-md scale-105 opacity-25"
        />
        {/* Deep dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060913]/95 via-[#0A0F1D]/85 to-[#0B132B]/95" />

        {/* Floating ambient glow lights */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 translate-x-1/3 translate-y-1/3 w-[34rem] h-[34rem] bg-amber-500/10 rounded-full blur-3xl" />

        {/* Micro geometric pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:32px_32px] opacity-35" />
      </div>

      {/* 2. Floating Card with Premium Depth */}
      <div className="relative z-10 max-w-4xl w-full bg-white rounded-3xl shadow-2xl shadow-black/60 border border-slate-700/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px] backdrop-blur-sm">

        {/* Left Side: Brand Showcase (Dark Minimalist Slate) */}
        <div className="lg:col-span-5 bg-slate-900/95 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
          {/* Ambient decorative subtle glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-slate-800/80 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <Link to="/home" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 bg-[#1E3A8A] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[#1e40af] transition-colors">
                <Paintbrush className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white leading-none block">
                  PAINTING<span className="text-amber-400">247</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                  Precision Paint — Dịch vụ sơn sửa chuyên nghiệp
                </span>
              </div>
            </Link>

            <div className="mt-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                Không gian mới, <br />
                <span className="text-amber-400">giá trị bền vững</span>.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ thống quản lý dịch vụ sơn nhà toàn diện: khảo sát chuẩn xác, hợp đồng điện tử minh bạch và bảo hành dài hạn.
              </p>
            </div>
          </div>

          {/* Middle Feature Highlights */}
          <div className="relative z-10 my-8 space-y-3.5">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span>Khảo sát &amp; báo giá tận nơi sau 30 phút</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span>Hợp đồng điện tử, bảo hành lên tới 5 năm</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <span>Đội ngũ thợ tay nghề cao, được chọn lọc</span>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Uy tín · Tận tâm · Đúng tiến độ</span>
            <Link to="/home" className="hover:text-white flex items-center gap-1 transition">
              <Home className="w-3.5 h-3.5" />
              Trang chủ
            </Link>
          </div>
        </div>

        {/* Right Side: Modern Authentication Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Header */}
            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-[#1E3A8A] tracking-tight">
                Đăng nhập tài khoản
              </h3>
              <p className="text-xs text-slate-500">
                Nhập thông tin xác thực để truy cập hệ thống Precision Paint
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* Email / Username Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Nhập email của bạn (ví dụ: user@example.com)..."
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật khẩu
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition disabled:bg-slate-50"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/20 active:scale-[0.99]"
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Quick Fill Box (Collapsed by default, expand on click) */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span>{showDemoAccounts ? "Ẩn tài khoản kiểm thử" : "Xem tài khoản kiểm thử (Demo)"}</span>
              </button>

              {showDemoAccounts && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => handleQuickFill(acc.identifier, acc.pass)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-left transition cursor-pointer"
                    >
                      <span className="block text-[11px] font-bold text-slate-800 truncate">
                        {acc.role}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                        {acc.identifier} / {acc.pass}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs text-slate-500">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-bold text-slate-900 hover:underline underline-offset-4"
            >
              Đăng ký tài khoản khách hàng
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
