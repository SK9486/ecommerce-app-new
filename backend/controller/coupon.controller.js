import Coupon from "../models/coupon.models.js";

// Get a single active coupon for the authenticated user
export const getCoupons = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });

    return res.status(200).json(coupon || null);
  } catch (error) {
    console.error("Error in getCoupon controller:", error.message);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Validate a coupon code and return its details if valid
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body; // Change from req.body to req.query
    console.log("Query code:", code); // Debug log

    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Valid coupon code is required" });
    }

    const coupon = await Coupon.findOne({
      code: code.trim(),
      userId: req.user._id,
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }

    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error in validateCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Bonus: Example of getting all active coupons (if needed)
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      userId: req.user._id,
      isActive: true,
    });

    return res.status(200).json({
      message: "Coupons retrieved successfully",
      count: coupons.length,
      coupons: coupons,
    });
  } catch (error) {
    console.error("Error in getAllCoupons controller:", error.message);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
