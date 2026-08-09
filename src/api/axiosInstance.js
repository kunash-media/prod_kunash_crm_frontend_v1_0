import axios from "axios";

const BASE_URL = "https://crm-api.kunashshowcase.online/api/admin";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // REQUIRED — sends/receives httpOnly cookies (admin_token, refresh_token)
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve();
  });
  pendingQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Don't try to refresh on the login/refresh endpoints themselves
    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // queue this request until the in-flight refresh finishes
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post("/auth/refresh"); // refresh_token cookie sent automatically
        processQueue(null);
        return axiosInstance(originalRequest); // retry original request
      } catch (refreshErr) {
        processQueue(refreshErr);
        sessionStorage.removeItem("kunash_auth");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;