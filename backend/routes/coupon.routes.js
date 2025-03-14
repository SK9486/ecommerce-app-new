import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getCoupons, validateCoupon } from "../controller/coupon.controller.js";
const router = Router();
router.get("/", protectRoute, getCoupons);
router.post("/validate", protectRoute, validateCoupon);
export default router;
