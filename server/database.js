const mongoose = require("mongoose");
require("dotenv").config();

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error("CRITICAL: MONGODB_URI is not set in environment variables!");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("Connected to MongoDB");

    try {
      const collection = mongoose.connection.collection("users");
      const indexes = await collection.indexes();
      const hasObsoleteIndex = indexes.some(
        (idx) => idx.name === "spotifyId_1",
      );
      if (hasObsoleteIndex) {
        await collection.dropIndex("spotifyId_1");
        console.log("Dropped obsolete spotifyId_1 index");
      }
    } catch (indexErr) {
      console.warn("Index check failed:", indexErr.message);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};

module.exports = connectDB;
