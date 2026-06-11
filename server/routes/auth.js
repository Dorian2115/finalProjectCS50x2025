const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const Favorite = require("../models/Favorite");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const connectDB = require("../database");

const router = express.Router();

router.get("/", async (request, response) => {
  try {
    const users = await User.find();
    response.json(users);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }
    console.log("User found:", user);
    console.log("Password hash:", user.passwordHash);
    console.log("Entered password:", password);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return response.status(401).json({ error: "Invalid password" });
    }

    const token = jsonwebtoken.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      },
    );
    response.json({ token, user });
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to login" });
  }
});

router.post("/register", async (request, response) => {
  try {
    const { spotifyId, email, displayName, password, profileImageUrl } =
      request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      spotifyId,
      email,
      displayName,
      profileImageUrl,
      passwordHash: hashedPassword,
    });
    const savedUser = await newUser.save();
    response.status(201).json(savedUser);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to create user" });
  }
});

module.exports = router;
