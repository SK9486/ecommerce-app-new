import { Router } from "express";
import {
  getProfile,
  login,
  logout,
  refreshToken,
  signUp,
} from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = Router();
router.post("/signup", signUp);
router.post("/login", login);
router.get("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
export default router;
