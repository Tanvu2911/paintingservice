import axios from "axios";
import { BASE_URL } from "./ApiEndpoints";

const AxiosConfig = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
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
            if (status === 401) {
                localStorage.removeItem("token");

                // Không redirect nếu đang ở trang login
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }

            // 403: Có đăng nhập nhưng KHÔNG CÓ QUYỀN
            else if (status === 403) {
                console.error(
                    "403 Forbidden: Bạn không có quyền truy cập API này."
                );

                // KHÔNG xóa token
                // KHÔNG redirect /login
            }

            else if (status === 500) {
                console.error("Lỗi server");
            }
        }

        else if (error.code === "ECONNABORTED") {
            console.error(
                "Request cần quá nhiều thời gian để phản hồi, vui lòng thử lại sau"
            );
        }

        return Promise.reject(error);
    }
);

export default AxiosConfig;