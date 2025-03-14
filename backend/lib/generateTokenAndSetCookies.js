import redis from "./redis.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateTokenAndSetCookies = async (id, res) => {
  try {
    // Check if JWT secrets are available in environment variables
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT secrets are missing in environment variables");
    }

    // Generate the access token with a 15-minute expiration
    const accessToken = jwt.sign(
      { userId: id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "30m" }
    );

    // Generate the refresh token with a 7-day expiration
    const refreshToken = jwt.sign(
      { userId: id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save the refresh token in Redis with a 7-day expiration
    await redis.set(`refreshToken:${id}`, refreshToken, "EX", 7 * 24 * 60 * 60);

    // Set cookies for both tokens in the response
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development", // Only use secure cookies in production
      sameSite: "strict", // Make cookies only sent for same-site requests
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return the generated tokens for further use if needed
    return { accessToken, refreshToken };
  } catch (error) {
    console.error(
      "❌ Error generating token and setting cookies:",
      error.message
    );
    throw new Error("Token generation failed"); // This will be caught in the controller
  }
};

export default generateTokenAndSetCookies;
