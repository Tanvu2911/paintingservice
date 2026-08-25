import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Paintbrush,
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast?.("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!", "warning");
      return;
    }

    try {
      setLoading(true);
      const response = await AxiosConfig.post(API_ENDPOINTS.login, {
        username: username.trim(),
        password: password.trim(),
      });

      const resData = response.data?.data || response.data;
      const token = resData.token || resData.accessToken;
      if (token) localStorage.setItem("token", token);

      onLogin(resData);
      showToast?.(
        `Đăng nhập thành công! Chào mừng ${resData.fullName || resData.username}`,
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
        "Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.";
      showToast?.(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    showToast?.(`Đã điền tài khoản: ${u}`, "info");
  };

  const demoAccounts = [
    { role: "Quản trị viên (Admin)", username: "admin", pass: "123456" },
    { role: "Giám sát viên (Survey)", username: "survey1", pass: "123456" },
    { role: "Kỹ thuật thi công (Technician)", username: "technician1", pass: "123456" },
    { role: "Khách hàng (Customer)", username: "customer1", pass: "123456" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Brand Showcase (Dark Minimalist Slate) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient decorative subtle glow */}
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
                Không gian mới, <br />
                <span className="text-emerald-400">giá trị bền vững</span>.
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
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Đăng nhập tài khoản
              </h3>
              <p className="text-xs text-slate-500">
                Nhập thông tin xác thực để truy cập hệ thống Painting247
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* Username Input */}
              <div className="space-y-1.5">
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition disabled:bg-slate-50"
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
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition disabled:bg-slate-50"
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
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  loading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-emerald-600/20"
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
                      onClick={() => handleQuickFill(acc.username, acc.pass)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-left transition cursor-pointer"
                    >
                      <span className="block text-[11px] font-bold text-slate-800 truncate">
                        {acc.role}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                        {acc.username} / {acc.pass}
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
