const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const spotifyRoutes = require("./routes/spotify");
const authRoutes = require("./routes/auth");
const favoritesRoutes = require("./routes/favorites");
const connectDB = require("./database");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://api.spotify.com https://accounts.spotify.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  next();
});

app.use("/api/spotify", spotifyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/favorites", favoritesRoutes);

app.use(express.json());
app.get("/", (request, response) => {
  response.send("Server is running");
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
