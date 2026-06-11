const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true },
  profileImageUrl: { type: String },
  passwordHash: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
