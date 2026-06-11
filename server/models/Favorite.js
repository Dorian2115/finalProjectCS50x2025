const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  trackId: { type: String, required: true },
  trackName: { type: String, required: true },
  albumName: { type: String },
  artistName: { type: String, required: true },
  albumImageUrl: { type: String, required: true },
  spotifyUrl: { type: String, required: true },
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
