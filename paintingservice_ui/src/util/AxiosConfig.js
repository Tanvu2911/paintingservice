import axios from "axios";
import { BASE_URL } from "./ApiEndpoints";

const AxiosConfig = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    timeout: 30000,
});

const excludeEndpoints = [
    "/login",
    "/register",
    "/home",
];

AxiosConfig.interceptors.request.use(
    (config) => {
        const shouldSkipToken = excludeEndpoints.some((endpoint) =>
            config.url?.includes(endpoint)
        );

        if (!shouldSkipToken) {
            const accessToken = localStorage.getItem("token");

            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

AxiosConfig.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const status = error.response.status;

            // 401: Token không hợp lệ / hết hạn / chưa đăng nhập
            // Hoặc 403 trên các endpoint cá nhân (/me) nghĩa là token không còn hợp lệ trên hệ thống
            const isIdentityEndpoint = error.config?.url?.includes("/me");
            if (status === 401 || (status === 403 && isIdentityEndpoint)) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                // Bắn event để AuthContext tự động cập nhật
                window.dispatchEvent(new Event("auth:logout"));

                // Chuyển hướng về login nếu chưa ở trang login
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
            // 403: Không có quyền truy cập tính năng cụ thể
            else if (status === 403) {
                console.warn("403 Forbidden: Bạn không có quyền thực hiện thao tác này.");
            }
            else if (status >= 500) {
                console.error("Lỗi hệ thống từ máy chủ (5xx).");
            }
        } else if (error.code === "ECONNABORTED") {
            console.error("Yêu cầu quá hạn thời gian xử lý (Timeout).");
        }

        return Promise.reject(error);
    }
);

export default AxiosConfig;