import toast from "react-hot-toast";
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useUserStore = create((set, get) => ({
  checkingAuth: false,
  user: null,
  isLoading: false,

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
      console.error("❌ Signup error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    try {
      set({ isLoading: true });
      if (!email || !password)
        throw new Error("Email and password are required");

      const res = await axiosInstance.post("/auth/login", { email, password });
      set({ user: res.data.user });
      toast.success("Login successful");
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await axiosInstance.get("/auth/logout");
      set({ user: null });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axiosInstance.get("/auth/profile");
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      set({ checkingAuth: false, user: null });
    }
  },
}));

let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise;
          return axiosInstance(originalRequest);
        }

        // Start a new refresh process
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
