import toast from "react-hot-toast";
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useUserStore = create((set, get) => ({
  checkingAuth: false,
  user: null,
  isLoading: false,
  refreshPromise: null,

  signup: async ({ name, email, password, confirmPassword }) => {
    try {
      set({ isLoading: true });

      if (!name || !email || !password) {
        throw new Error("All fields are required");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      console.log("Sending request with:", { name, email, password });
      const res = await axiosInstance.post("/auth/signup", {
        name,
        email,
        password,
      });

      set({ user: res.data.user });
      toast.success("Signup successful");
    } catch (error) {
      console.error("❌ Error occurred while signing up:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    try {
      set({ isLoading: true });

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const res = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      set({ user: res.data.user });
      toast.success("Login successful");
    } catch (error) {
      console.error("❌ Error occurred while logging in:", error);
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
      console.error("❌ Error occurred while logging out:", error);
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

  refreshToken: async () => {
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axiosInstance.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// Axios Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshPromise, refreshToken } = useUserStore.getState();

      try {
        if (refreshPromise) {
          await refreshPromise;
          return axiosInstance(originalRequest);
        }

        const newRefreshPromise = refreshToken();
        useUserStore.setState({ refreshPromise: newRefreshPromise });
        await newRefreshPromise;
        useUserStore.setState({ refreshPromise: null });

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
