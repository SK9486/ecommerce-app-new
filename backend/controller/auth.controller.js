import generateTokenAndSetCookies from "../lib/generateTokenAndSetCookies.js";
import redis from "../lib/redis.js";
import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
export const signUp = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate input fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Validate email format
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Create user first
    const newUser = await User.create({
      name,
      email,
      password,
    });

    // ✅ Generate token and set cookies only if user is created
    await generateTokenAndSetCookies(newUser._id, res);

    return res.status(201).json({
      message: "User created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        cartItems: newUser.cartItems,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("❌ Error occurred while signing up:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const userExist = await User.findOne({ email });
    if (!userExist) {
      return res.status(400).json({ message: "User does not exist" });
    }
    if (!(await userExist.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid password" });
    }

    await generateTokenAndSetCookies(userExist._id, res);
    return res.status(200).json({
      message: "User logged in successfully",
      user: {
        _id: userExist._id,
        name: userExist.name,
        email: userExist.email,
        role: userExist.role,
        cartItems: userExist.cartItems,
      },
    });
  } catch (error) {
    console.error("Error occurred while logging in", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decode = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      await redis.del(`refreshToken:${decode.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("❌ Error occurred while logging out:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    const decode = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const storedToken = await redis.get(`refreshToken:${decode.userId}`);
    if (!storedToken) {
      return res
        .status(401)
        .json({ message: "Refresh token not found in Redis" });
    }
    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token mismatch" });
    }
    const accessToken = jwt.sign(
      { userId: decode.userId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development", // Only use secure cookies in production
      sameSite: "strict", // Make cookies only sent for same-site requests
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    return res.status(200).json({ message: "Token refreshed successfully" });
  } catch (err) {
    console.log("❌ Error occurred while refreshing token:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in getProfile controller", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
