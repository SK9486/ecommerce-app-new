import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error("Please define the MONGODB_URI");
    }
    console.log("🔄 Connecting to MongoDB...");
    const connection = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(
      "❌ Error occurred while connecting to MongoDB:",
      error.message
    );
    process.exit(1);
  }
};

export default connectDB;
