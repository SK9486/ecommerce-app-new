import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getCartProducts,
  addProductToCart,
  removeAllCartProducts,
  updateProductQuantity,
  removeAll,
} from "../controller/cart.controller.js";
const router = Router();
router.get("/", protectRoute, getCartProducts);
router.post("/", protectRoute, addProductToCart);
router.delete("/", protectRoute, removeAllCartProducts);
router.delete("/all", protectRoute, removeAll);
router.put("/:id", protectRoute, updateProductQuantity);
export default router;
