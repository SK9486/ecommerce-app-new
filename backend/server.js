import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import connectDB from "./lib/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5001;
app.use(express.json());
dotenv.config();
console.log(process.env.FRONTEND_URL);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}
const startServer = async () => {
  try {
    console.log("🔄 Starting backend... Connecting to database...");
    await connectDB(); // Ensure the DB is connected before starting the server
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error during server startup:", err.message);
    process.exit(1); // Exit the process if the DB connection fails
  }
};

startServer();
