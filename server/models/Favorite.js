const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  playlistId: { type: String, required: true },
  playlistName: { type: String, required: true },
  playlistImage: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
