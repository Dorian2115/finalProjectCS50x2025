const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const connectDB = require("../database");
const Favorite = require("../models/Favorite");

const router = express.Router();

router.get("/", async (request, response) => {
  try {
    const favorites = await Favorite.find();
    response.json(favorites);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to fetch favorites" });
  }
});

router.post("/", async (request, response) => {
  try {
    const {
      track_id,
      user_id,
      album_id,
      track_name,
      artist_name,
      album_name,
      album_image_url,
      spotify_url,
    } = request.body;
    request.body;

    const user = await User.findOne({ spotifyId: user_id });
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    const newFavorite = new Favorite({
      userId: user_id,
      trackId: track_id,
      trackName: track_name,
      artistName: artist_name,
      albumName: album_name,
      albumImageUrl: album_image_url,
      spotifyUrl: spotify_url,
    });

    const savedFavorite = await newFavorite.save();
    response.status(200).json({
      message: "Playlist added to favorites",
      favorite: savedFavorite,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to add favorite" });
  }
});

router.delete("/:id", async (request, response) => {
  console.log("Usuwanie playlisty z ulubionych");
  try {
    const { id } = request.params;
    const { user_id } = request.body;

    const user = await User.findOne({ spotifyId: user_id });
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    const favorites = await Favorite.findOne({ _id: id, userId: user.id });
    if (!favorites) {
      return response.status(404).json({ error: "Favorite not found" });
    }
    await Favorite.deleteOne({ _id: id, userId: user.id });
    response.status(200).json({ message: "Playlist removed from favorites" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to remove favorite" });
  }
});

module.exports = router;
