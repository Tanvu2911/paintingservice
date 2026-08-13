import AxiosConfig from "../configs/AxiosConfig";

export const getAllStaff = () => {
    return AxiosConfig.get("/staff");
};

export const getStaffById = (id) => {
    return AxiosConfig.get(`/staff/${id}`);
};

export const createUser = (payload) => {
    return AxiosConfig.post("/users", payload);
};

export const createStaff = (payload) => {
    return AxiosConfig.post("/staff", payload);
};

export const updateStaff = (id, payload) => {
    return AxiosConfig.put(`/staff/${id}`, payload);
};

export const deleteStaff = (id) => {
    return AxiosConfig.delete(`/staff/${id}`);
};