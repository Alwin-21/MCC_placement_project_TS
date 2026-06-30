import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5203/api",
});

// Automatically inject JWT token into all requests if present in localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");

    // Prioritize adminToken if requesting admin APIs or if currently on an admin route
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    const isAdminRequest = config.url && config.url.toLowerCase().includes("/admin");

    if (isAdminRoute || isAdminRequest) {
      token = adminToken || token;
    } else {
      token = token || adminToken;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;