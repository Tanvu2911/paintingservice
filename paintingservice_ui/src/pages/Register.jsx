import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AxiosConfig from "../util/AxiosConfig";
import { API_ENDPOINTS } from "../util/ApiEndpoints";

function Register({ showToast }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      showToast?.("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }

    try {
      setLoading(true);
      await AxiosConfig.post(API_ENDPOINTS.register, { username, email, password });
      showToast?.("Đăng ký tài khoản thành công!", "success");
      navigate("/login");
    } catch (error) {
      console.error(error);
      showToast?.(
        error.response?.data?.message ||
          error.response?.data ||
          "Đăng ký thất bại!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Đăng Ký Tài Khoản</h2>
          <p className="text-gray-500 mt-2">Tạo tài khoản khách hàng mới</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Tên đăng nhập
            </label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-semibold transition-all ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Đang xử lý..." : "Đăng Ký"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
