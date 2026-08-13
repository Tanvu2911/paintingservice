import axios from "axios";
import { BASE_URL } from "./ApiEndpoints";

// Config kiểu dữ liệu có thể nhận được trong headers và kiểu dữ liệu muốn nhận lại là json
const AxiosConfig = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Danh sách các endpoint có thể sử dụng mà không cần token
const excludeEndpoints = [
    "/login",
    "/register",
    "/home",
];

// Chạy trước mỗi request
// Thêm token vào authorization trong header cho endpoint cần
// Nếu không cần thì reqest luôn
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

// Chạy trước mỗi response
// Nếu mà response valid thì trả về luôn
// Nếu có lỗi 401 => Về màn hình login
// Nếu có lỗi 500 => Lỗi server
// Nếu có lỗi timeout (ECONNABORTED) => log lỗi ra
AxiosConfig.interceptors.response.use(
    (response) => {
        return response;
    },
   (error) => {
        if (error.response) {
            // Thêm mã 403 vào đây vì Spring Security thường ném 403 khi thiếu/sai Token
            if (error.response.status === 401 || error.response.status === 403) {
                // Tùy chọn: Xóa token cũ bị lỗi trước khi về trang login
                localStorage.removeItem("token");
                window.location.href = "/login";
            } else if (error.response.status === 500) {
                console.error("Lỗi server");
            }
        } else if (error.code === "ECONNABORTED") {
            console.error(
                "Request cần quá nhiều thời gian để phản hồi, vui lòng thử lại sau"
            );
        }
        return Promise.reject(error);
    }
);

export default AxiosConfig;
