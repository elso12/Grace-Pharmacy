import mongoose from "mongoose";

// This looks for the Docker environment variable FIRST.
// If it fails or you run it locally, it safely falls back to 127.0.0.1 (IPv4).
const MONGO_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pharmacy-management";

export const connectDB = async (): Promise<void> => {
  try {
    const uriToConnect = (process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pharmacy-management") + "?directConnection=true";
    console.log(`Trying to connect to MongoDB at: \${uriToConnect}`);
    const conn = await mongoose.connect(uriToConnect, {
      serverSelectionTimeoutMS: 5000, // Fails quickly if it can't connect, instead of hanging
    });
    console.log(`\n 🟢 MongoDB Connected Successfully: \${conn.connection.host}`);
  } catch (error: any) {
    console.error(`\n 🔴 MongoDB Connection Error Object:`, error);
    process.exit(1); // Stop the server if DB fails
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("[WARN] MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("[ERROR] MongoDB error:", err);
});

export default connectDB;