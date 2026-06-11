const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");

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
    if (!email || !password) {
      return response.status(400).json({ error: "Email i hasło są wymagane" });
    }
    if (!email.includes("@")) {
      return response.status(400).json({ error: "Nieprawidłowy format email" });
    }
    if (password.length < 6) {
      return response
        .status(400)
        .json({ error: "Hasło musi mieć co najmniej 6 znaków" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

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
    response.json({
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName },
    });
    console.log(user);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to login" });
  }
});

router.post("/register", async (request, response) => {
  try {
    const { email, displayName, password, profileImageUrl } = request.body;

    if (!email || !password || !displayName) {
      return response.status(400).json({ error: "Wszystkie pola są wymagane" });
    }
    if (!email.includes("@")) {
      return response.status(400).json({ error: "Nieprawidłowy format email" });
    }
    if (password.length < 6) {
      return response
        .status(400)
        .json({ error: "Hasło musi mieć co najmniej 6 znaków" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return response
        .status(400)
        .json({ error: "Użytkownik z tym emailem już istnieje" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
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
