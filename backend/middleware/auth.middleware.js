import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "No access token provided" });
    }
    const decode = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    const userExist = await User.findById(decode.userId).select("-password");
    if (!userExist) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = userExist;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized - Access token expired" });
    }
    console.error("❌ Error occurred while protecting route:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const adminRoute = (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("❌ Error occurred while protecting route:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
