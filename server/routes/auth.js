const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

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

router.post(
  "/login",
  body("email").isEmail().withMessage("Niepoprawny format email"),
  body("password").notEmpty().withMessage("Hasło jest wymagane"),
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg);
      return response.status(400).json({ error: errorMessages.join(", ") });
    }
    try {
      const { email, password } = request.body;

      const user = await User.findOne({ email });
      if (!user) {
        return response.status(404).json({ error: "Użytkownik nie istnieje" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return response.status(401).json({ error: "Nieprawidłowe hasło" });
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
  }
);

router.post(
  "/register",
  body("email")
    .isEmail()
    .withMessage("Niepoprawny format adresu email")
    .isLength({ min: 5, max: 320 })
    .withMessage("Email musi mieć od 5 do 320 znaków"),
  body("displayName")
    .isLength({ min: 3, max: 20 })
    .withMessage("Imię/nazwa musi mieć od 3 do 20 znaków"),
  body("password")
    .isLength({ min: 8, max: 100 })
    .withMessage("Hasło musi mieć od 8 do 100 znaków"),
  body("profileImageUrl")
    .optional()
    .isURL()
    .withMessage("Niepoprawny URL zdjęcia profilowego"),
  async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg);
      return response.status(400).json({ error: errorMessages.join(", ") });
    }
    try {
      const { email, displayName, password, profileImageUrl } = request.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return response
          .status(409)
          .json({ error: "Użytkownik z tym emailem już istnieje" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        email,
        displayName,
        profileImageUrl,
        passwordHash: hashedPassword,
      });

      const user = await newUser.save();
      const token = jsonwebtoken.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        },
      );
      console.log(user);
      response.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    } catch (err) {
      console.error(err);
      response.status(500).json({ error: "Failed to create user" });
    }
  },
);

module.exports = router;
