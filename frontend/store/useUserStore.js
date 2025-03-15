import toast from "react-hot-toast";
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useUserStore = create((set, get) => ({
  checkingAuth: false,
  user: null,
  isLoading: false,

  // Signup function
  signup: async ({ name, email, password, confirmPassword }) => {
    try {
      set({ isLoading: true });
      if (!name || !email || !password)
        throw new Error("All fields are required");
      if (password !== confirmPassword)
        throw new Error("Passwords do not match");

      const res = await axiosInstance.post("/auth/signup", {
        name,
        email,
        password,
      });
      set({ user: res.data.user });
      toast.success("Signup successful");
    } catch (error) {
      console.error("❌ Signup error:", error.response?.data || error.message);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  // Login function (session-based, with optional token support)
  login: async ({ email, password }) => {
    try {
      set({ isLoading: true });
      if (!email || !password)
        throw new Error("Email and password are required");

      const res = await axiosInstance.post("/auth/login", { email, password });
      console.log("Login response:", res.data); // Debug log
      const { user, token } = res.data; // Adjust based on backend response
      set({ user });

      // Optional: If your backend returns a token instead of relying on cookies
      if (token) {
        localStorage.setItem("token", token);
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      toast.success("Login successful");
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout function
  logout: async () => {
    try {
      set({ isLoading: true });
      await axiosInstance.get("/auth/logout");
      set({ user: null });
      localStorage.removeItem("token"); // Clear token if used
      delete axiosInstance.defaults.headers.common["Authorization"];
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error.response?.data || error.message);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  // Check authentication status
  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      // If using tokens, restore from localStorage
      const token = localStorage.getItem("token");
      if (token) {
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
      }
      const response = await axiosInstance.get("/auth/profile");
      console.log("CheckAuth response:", response.data); // Debug log
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      console.error(
        "❌ Auth check failed:",
        error.response?.data || error.message
      );
      set({ checkingAuth: false, user: null });
    }
  },

  // Optional: Refresh token (only if your backend uses tokens and has a refresh endpoint)
  refreshToken: async () => {
    try {
      const res = await axiosInstance.post("/auth/refresh");
      const newToken = res.data.token; // Adjust based on backend response
      localStorage.setItem("token", newToken);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newToken}`;
      return newToken;
    } catch (error) {
      console.error(
        "❌ Refresh token error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
}));

// Axios interceptor for handling 401 errors
let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("401 detected, attempting refresh...");
        if (refreshPromise) {
          await refreshPromise;
          return axiosInstance(originalRequest);
        }

        // Only attempt refresh if you have a refresh endpoint and use tokens
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        console.log("Token refreshed, retrying request...");
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Refresh failed, logging out...");
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
