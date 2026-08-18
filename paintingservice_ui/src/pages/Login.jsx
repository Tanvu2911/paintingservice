import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AxiosConfig from "../util/AxiosConfig";
import { API_ENDPOINTS } from "../util/ApiEndpoints";
import { getRedirectPath } from "../util/roleUtils";

function Login({ onLogin, showToast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast?.("Vui lòng nhập đủ thông tin!", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await AxiosConfig.post(API_ENDPOINTS.login, {
        username,
        password,
      });

      const resData = response.data?.data || response.data;
      const token = resData.token || resData.accessToken;
      if (token) localStorage.setItem("token", token);

      onLogin(resData);
      showToast?.("Đăng nhập thành công!", "success");
      
      const targetPath = location.state?.redirectTo || getRedirectPath(resData);
      navigate(targetPath, { 
        state: { 
          serviceId: location.state?.serviceId,
          serviceName: location.state?.serviceName 
        },
        replace: true 
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      showToast?.(
        error.response?.data?.message ||
          "Đăng nhập thất bại! Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-800 tracking-tight">
            Đăng Nhập Hệ Thống
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Vui lòng điền thông tin tài khoản của bạn
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                placeholder="Nhập tài khoản..."
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 px-4 text-sm font-bold rounded-xl text-white transition-all duration-200 shadow-md ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
            }`}
          >
            {loading ? "Đang xử lý..." : "Đăng Nhập"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-500 transition-colors underline-offset-4 hover:underline"
          >
            Đăng ký ngay
          </Link>
          {" · "}
          <Link to="/home" className="text-slate-500 hover:text-slate-700">
            Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
