import { config } from "dotenv";
import Stripe from "stripe";

config();

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("❌ Stripe secret key is not defined");
  throw new Error("Stripe secret key is not defined in environment variables");
}

const stripe = new Stripe(stripeKey);
console.log("✅ Stripe initialized");

export default stripe;
