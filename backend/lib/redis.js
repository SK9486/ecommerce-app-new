import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
if (!process.env.REDIS_URL) {
  console.error("Please define the REDIS_URL");
  process.exit(1);
}
const redis = new Redis(process.env.REDIS_URL);
redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis Connection Error:", err));
export default redis;
