import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const apiError = new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "API request failed",
    );

    apiError.code = error.response?.data?.code ?? null;
    apiError.status = error.response?.status ?? null;
    apiError.details = error.response?.data ?? null;

    return Promise.reject(apiError);
  },
);

export default api;
