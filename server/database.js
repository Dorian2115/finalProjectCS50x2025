const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    console.log(process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Tymczasowe usunięcie starego indeksu spotifyId_1, który powoduje błędy E11000
    try {
      const collection = mongoose.connection.collection("users");
      const indexes = await collection.indexes();
      const hasObsoleteIndex = indexes.some(idx => idx.name === "spotifyId_1");
      if (hasObsoleteIndex) {
        await collection.dropIndex("spotifyId_1");
        console.log("Pomyślnie usunięto stary indeks spotifyId_1");
      }
    } catch (indexErr) {
      console.warn("Nie udało się sprawdzić/usunąć indeksu spotifyId_1:", indexErr.message);
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
