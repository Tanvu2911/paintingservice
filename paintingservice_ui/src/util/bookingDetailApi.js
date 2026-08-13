import AxiosConfig from "./AxiosConfig";

export const bookingDetailApi = {
  list: async (bookingId) => {
    const response = await AxiosConfig.get(`/booking-details/booking/${bookingId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
  create: async (bookingId) => {
    const response = await AxiosConfig.post("/booking-details", { bookingId });
    return response.data;
  },
  updateSurvey: async (detailId, { surveyNote, materialNote, files = [] }) => {
    const formData = new FormData();
    if (surveyNote != null) formData.append("surveyNote", surveyNote);
    if (materialNote != null) formData.append("materialNote", materialNote);
    files.forEach((file) => formData.append("files", file));
    const response = await AxiosConfig.put(`/booking-details/${detailId}/survey`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  reportShortage: async (detailId, materialShortage) => {
    const response = await AxiosConfig.put(`/booking-details/${detailId}/material-shortage`, { materialShortage });
    return response.data;
  },
  supervisorAccept: async (detailId) => (await AxiosConfig.post(`/booking-details/${detailId}/supervisor-accept`)).data,
  customerAccept: async (detailId) => (await AxiosConfig.post(`/booking-details/${detailId}/customer-accept`)).data,
};

export const splitImageUrls = (value) => (typeof value === "string" ? value.split(",").map((url) => url.trim()).filter(Boolean) : []);
