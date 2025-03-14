import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

export const useCartStore = create((set, get) => ({
  isLoading: false,
  cart: [],
  recommendedProducts: [],
  coupon: null,
  total: 0,
  subtotal: 0,
  isCouponApplied: false,

  getMyCoupon: async () => {
    try {
      const response = await axiosInstance.get("/coupons");
      set({ coupon: response.data });
    } catch (error) {
      console.error("Error fetching coupon:", error);
    }
  },
  applyCoupon: async (code) => {
    try {
      console.log("Applying coupon with code:", code);
      const response = await axiosInstance.post("/coupons/validate", { code });
      console.log("Response:", response.data); // Log the response
      set({ coupon: response.data, isCouponApplied: true });
      get().calculateTotals();
      toast.success("Coupon applied successfully");
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    }
  },
  removeCoupon: () => {
    set({ coupon: null, isCouponApplied: false });
    get().calculateTotals();
    toast.success("Coupon removed");
  },

  addToCart: async (product) => {
    if (!product || !product._id) {
      toast.error("Invalid product data");
      return;
    }

    try {
      await axiosInstance.post("/cart", { productId: product._id });
      set((prevState) => {
        console.log("Cart before update:", prevState.cart); // Log the cart state
        const cart = Array.isArray(prevState.cart) ? prevState.cart : [];
        const existingItem = cart.find((item) => item._id === product._id);
        const newCart = existingItem
          ? cart.map((item) =>
              item._id === product._id
                ? { ...item, quantity: (item.quantity || 0) + 1 }
                : item
            )
          : [...cart, { ...product, quantity: 1 }];
        return { cart: newCart };
      });
      get().calculateTotals();
      toast.success("Product added to cart");
    } catch (error) {
      console.log("❌ Error occurred while adding to cart:", error.message);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (!productId) return;

    try {
      if (quantity < 0) return;

      if (quantity === 0) {
        await get().removeFromCart(productId);
        return;
      }

      await axiosInstance.put(`/cart/${productId}`, { quantity });
      set((prevState) => {
        return {
          cart: prevState.cart.map((item) =>
            item._id === productId ? { ...item, quantity } : item
          ),
        };
      });
      get().calculateTotals();
    } catch (error) {
      console.log("❌ Error occurred while updating quantity:", error.message);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  getCartItems: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/cart");
      set({ cart: res.data });
      get().calculateTotals();
    } catch (error) {
      set({ cart: [] });
      console.log("❌ Error occurred while getting cart items:", error.message);
      // toast.error(error.response?.data?.message || "Something went wrong");
      set({ cart: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  removeFromCart: async (productId) => {
    if (!productId) return;

    try {
      await axiosInstance.delete(`/cart/`, { productId });
      set((prevState) => ({
        cart: (prevState.cart || []).filter((item) => item._id !== productId),
      }));
      get().calculateTotals();
      toast.success("Product removed from cart");
    } catch (error) {
      console.log("❌ Error occurred while removing from cart:", error.message);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  calculateTotals: () => {
    try {
      const { cart, coupon } = get();
      if (!Array.isArray(cart)) {
        set({ total: 0, subtotal: 0 });
        return;
      }

      const subtotal = cart.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0);

      let total = subtotal;
      if (coupon && coupon.discount) {
        const discount = (coupon.discount / 100) * subtotal;
        total = subtotal - discount;
      }

      set({ total, subtotal });
    } catch (error) {
      console.log("❌ Error occurred while calculating total:", error.message);
      set({ total: 0, subtotal: 0 });
    }
  },

  getRecommendedProducts: async () => {
    try {
      const res = await axiosInstance.get("/products/recommended");
      set({ recommendedProducts: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      console.log(
        "❌ Error occurred while getting recommended products:",
        error.message
      );
      toast.error(error.response?.data?.message || "Something went wrong");
      set({ recommendedProducts: [] });
    }
  },
  removeAllCartProduct: async () => {
    try {
      set({ isLoading: true });
      // Make API call to clear cart on backend
      await axiosInstance.delete("/cart/all");
      set({
        cart: [],
        total: 0,
        subtotal: 0,
        coupon: null,
        isCouponApplied: false,
      });

      toast.success("Cart cleared successfully");
    } catch (error) {
      console.error("❌ Error occurred while clearing cart:", error.message);
      toast.error(error.response?.data?.message || "Failed to clear cart");
    } finally {
      set({ isLoading: false });
    }
  },
}));
