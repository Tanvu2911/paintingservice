export const BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:8080/api" : "/api");

export const API_ENDPOINTS = {
    login: "/login",
    register: "/register",
    home: "/home",
};
