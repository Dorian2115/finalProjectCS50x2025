const express = require("express");
const User = require("../models/User");
const Favorite = require("../models/Favorite");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.use(authMiddleware.authenticateToken);

// pobierz ulubione
router.get("/", async (request, response) => {
  try {
    const favorites = await Favorite.find();
    response.json(favorites);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to fetch favorites" });
  }
});

// dodaj do ulubionych
router.post("/", async (request, response) => {
  try {
    const { playlist_id, playlist_name, playlist_image, user_id } =
      request.body;

    const user = await User.findOne({ spotifyId: user_id });
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    const newFavorite = new Favorite({
      userId: user._id,
      playlistId: playlist_id,
      playlistName: playlist_name,
      playlistImage: playlist_image,
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

// usun z ulubionych
router.delete("/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const { user_id } = request.body;

    const user = await User.findOne({ spotifyId: user_id });
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    const favorites = await Favorite.findOne({
      playlistId: id,
      userId: user._id,
    });
    if (!favorites) {
      return response.status(404).json({ error: "Favorite not found" });
    }
    await Favorite.deleteOne({ playlistId: id, userId: user._id });
    response.status(200).json({ message: "Playlist removed from favorites" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to remove favorite" });
  }
});

module.exports = router;
