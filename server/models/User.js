const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  spotifyId: { type: String, unique: true, sparse: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profileImageUrl: { type: String },
  passwordHash: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
