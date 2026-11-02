import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT access token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const access = localStorage.getItem("wrh_access_token");
    if (access && config.headers) {
      config.headers.Authorization = `Bearer ${access}`;
    }
  }
  return config;
});

// Response interceptor to automatically refresh tokens on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("wrh_refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(`${baseURL}/api/auth/token/refresh/`, {
            refresh,
          });
          const newAccess = res.data.access;
          localStorage.setItem("wrh_access_token", newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("wrh_access_token");
          localStorage.removeItem("wrh_refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);
