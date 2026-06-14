const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const validator = require("password-validator");

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

    const passwordSchema = new validator();
    const emailSchema = new validator();

    emailSchema.is().min(5).is().max(320).is().email();

    passwordSchema
      .is()
      .min(8)
      .is()
      .max(100)
      .has()
      .uppercase()
      .has()
      .lowercase()
      .has()
      .digits(2)
      .has()
      .not()
      .spaces()
      .has()
      .not()
      .oneOf([
        "Passw0rd",
        "Password123",
        "qwerty",
        "12345678",
        "123456789",
        "password",
        "admin",
        "root",
        "test",
        "[PASSWORD]",
        "[PASSWORD]",
        "[PASSWORD]",
      ]);

    const passwordErrors = passwordSchema.validate(password, { details: true });
    if (passwordErrors.length > 0) {
      const errorMessages = passwordErrors.map((err) => err.message);
      return response.status(400).json({ error: errorMessages.join(", ") });
    }

    const emailErrors = emailSchema.validate(email, { details: true });
    if (emailErrors.length > 0) {
      const errorMessages = emailErrors.map((err) => err.message);
      return response.status(400).json({ error: errorMessages.join(", ") });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return response.status(401).json({ error: "Password doesn't match" });
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

    const passwordSchema = new validator();
    const emailSchema = new validator();
    const displayNameSchema = new validator();

    emailSchema.is().min(5).is().max(320).is().email();

    displayNameSchema
      .is()
      .min(3)
      .is()
      .max(20)
      .has()
      .not()
      .spaces()
      .has()
      .not()
      .oneOf([
        "admin",
        "root",
        "test",
        "[PASSWORD]",
        "[PASSWORD]",
        "[PASSWORD]",
      ]);

    passwordSchema
      .is()
      .min(8)
      .is()
      .max(100)
      .has()
      .uppercase()
      .has()
      .lowercase()
      .has()
      .digits(2)
      .has()
      .not()
      .spaces()
      .has()
      .not()
      .oneOf([
        "Passw0rd",
        "Password123",
        "qwerty",
        "12345678",
        "123456789",
        "password",
        "admin",
        "root",
        "test",
        "[PASSWORD]",
        "[PASSWORD]",
        "[PASSWORD]",
      ]);

    const passwordErrors = passwordSchema.validate(password, { details: true });
    if (passwordErrors.length > 0) {
      const errorMessages = passwordErrors.map((err) => err.message);
      return response.status(400).json({ error: errorMessages.join(", ") });
    }

    const emailErrors = emailSchema.validate(email, { details: true });
    if (emailErrors.length > 0) {
      const errorMessages = emailErrors.map((err) => err.message);
      return response.status(400).json({ error: errorMessages.join(", ") });
    }

    const displayNameErrors = displayNameSchema.validate(displayName, {
      details: true,
    });
    if (displayNameErrors.length > 0) {
      const errorMessages = displayNameErrors.map((err) => err.message);
      return response.status(400).json({ error: errorMessages.join(", ") });
    }

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
      user: { id: user._id, email: user.email, displayName: user.displayName },
    });
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to create user" });
  }
});

module.exports = router;
