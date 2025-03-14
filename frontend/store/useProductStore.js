import toast from "react-hot-toast";
import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useProductStore = create((set) => ({
  products: [],
  isLoading: false,
  createProduct: async (product) => {
    try {
      set({ isLoading: true });

      const response = await axiosInstance.post("/products", product);

      set((state) => ({
        products: [...state.products, response.data], // Update state with new product
      }));

      toast.success("Product created successfully!");
    } catch (error) {
      console.log("❌ Error occurred while creating product:", error.message);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },
  fetchAllProducts: async () => {
    try {
      set({ isLoading: true });
      const response = await axiosInstance.get("/products");
      set({ products: response.data });
    } catch (error) {
      console.log("❌ Error occurred while creating product:", error.message);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },
  deleteProduct: async (id) => {
    try {
      set({ isLoading: true });
      await axiosInstance.delete(`/products/${id}`);
      set((state) => ({
        products: state.products.filter((product) => product._id !== id),
      }));
    } catch (error) {
      console.log("❌ Error occurred while creating product:", error.message);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isLoading: false });
    }
  },
  toggleFeaturedProduct: async (productId) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.patch(`/products/${productId}`);
      // this will update the isFeatured prop of the product
      set((prevProducts) => ({
        products: prevProducts.products.map((product) =>
          product._id === productId
            ? { ...product, isFeatured: response.data.isFeatured }
            : product
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      console.log("Error updating product:", error);
      toast.error(error.response.data.error || "Failed to update product");
    }
  },
  fetchFeaturedProducts: async () => {
    set({ loading: true });
    try {
      const response = await axiosInstance.get("/products/featured");
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.log("Error updating product:", error);
      toast.error(error.response.data.error || "Failed to update product");
    }
  },
  fetchByCategory: async (category) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(
        `/products/category/${category}`
      );
      set({ products: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.log("Error updating product:", error);
      toast.error(error.response.data.error || "Failed to update product");
    }
  },
}));
