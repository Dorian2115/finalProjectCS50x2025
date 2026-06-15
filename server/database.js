const mongoose = require("mongoose");
require("dotenv").config();

// laczenie z baza mongo
const connectDB = async () => {
  try {
    console.log(process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // usuwanie starego indeksu spotifyId_1 jesli istnieje
    try {
      const collection = mongoose.connection.collection("users");
      const indexes = await collection.indexes();
      const hasObsoleteIndex = indexes.some(idx => idx.name === "spotifyId_1");
      if (hasObsoleteIndex) {
        await collection.dropIndex("spotifyId_1");
        console.log("Dropped obsolete spotifyId_1 index");
      }
    } catch (indexErr) {
      console.warn("Index check failed:", indexErr.message);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
