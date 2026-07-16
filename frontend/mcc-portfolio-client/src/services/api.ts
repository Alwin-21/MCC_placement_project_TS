import axios from "axios";
import { mapKeysToCamelCase, fixUrlsInObject } from "@/utils/mapper";

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:3001/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
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

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Automatically map PascalCase database response keys to camelCase frontend keys and fix legacy backend URLs
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = mapKeysToCamelCase(response.data);
      if (typeof window !== "undefined") {
        response.data = fixUrlsInObject(response.data, window.location.origin);
      }
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;