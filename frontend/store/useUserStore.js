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
      console.error("❌ Signup error:", error.response?.data || error.message);
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
      console.log("Login response:", res.data); // Debug log
      console.log("Cookies set:", document.cookie); // Check cookies
      set({ user: res.data.user });
      toast.success("Login successful");
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);
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
      console.error("❌ Logout error:", error.response?.data || error.message);
      toast.error(error.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axiosInstance.get("/auth/profile");
      console.log("CheckAuth response:", response.data); // Debug log
      console.log("Cookies sent:", document.cookie); // Check cookies
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      console.error(
        "❌ Auth check failed:",
        error.response?.data || error.message
      );
      console.error("Error status:", error.response?.status);
      // Only reset user if explicitly unauthorized and no user exists
      if (error.response?.status === 401 && !get().user) {
        set({ user: null });
      }
      set({ checkingAuth: false });
    }
  },
}));
