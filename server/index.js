const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const connectDB = require("./database");
const Favorite = require("./models/Favorite");
const User = require("./models/User");
const bcrypt = require("bcrypt");

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

app.use(express.json());
app.get("/", (request, response) => {
  response.send("Server is running");
});

function getAccessToken(request) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

app.get("/login", (request, response) => {
  let queryParams = {
    client_id: process.env.CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope:
      "user-read-private user-read-email playlist-read-private user-top-read user-read-playback-state user-read-currently-playing user-read-recently-played user-read-playback-position",
  };

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify(queryParams);

  response.redirect(authUrl);
});

app.post("/api/refresh", async (request, response) => {
  try {
    const { refresh_token } = request.body;
    if (!refresh_token) {
      return response.status(400).json({ error: "refresh_token is required" });
    }
    const tokenResponse = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: querystring.stringify({
        refresh_token: refresh_token,
        grant_type: "refresh_token",
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET,
          ).toString("base64"),
      },
    });

    const { data: userData } = await axios.get(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
        },
      },
    );

    try {
      await User.findOneAndUpdate(
        { spotifyId: userData.id },
        {
          spotifyId: userData.id,
          email: userData.email,
          displayName: userData.display_name,
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      console.error("Error saving user:", error);
    }

    response.json({
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token || refresh_token,
      expires_in: tokenResponse.data.expires_in,
      user_id: userData.id,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to refresh token" });
  }
});

app.get("/api/user/information", async (request, response) => {
  try {
    const access_token = getAccessToken(request);

    const userResponse = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = {
      ...userResponse.data,
    };

    response.json(userData);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to get user" });
  }
});

app.get("/api/user/topArtists", async (request, response) => {
  try {
    const access_token = getAccessToken(request);

    const topArtistsResponse = await axios.get(
      "https://api.spotify.com/v1/me/top/artists",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const topArtistsData = {
      ...topArtistsResponse.data,
    };

    response.json(topArtistsData);
  } catch (error) {
    response.status(500).json({ error: "Failed to get top artists" });
  }
});

app.get("/api/user/topTracks", async (request, response) => {
  try {
    const access_token = getAccessToken(request);

    const topTracksResponse = await axios.get(
      "https://api.spotify.com/v1/me/top/tracks",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    response.json(topTracksResponse.data);
  } catch (error) {
    response.status(500).json({ error: "Failed to get top tracks" });
  }
});

app.get("/callback", async (request, response) => {
  console.log("Callback");
  try {
    const code = request.query.code || null;
    const tokenResponse = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: querystring.stringify({
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET,
          ).toString("base64"),
      },
    });

    let spotifyUserId = "";
    try {
      const { data: userData } = await axios.get(
        "https://api.spotify.com/v1/me",
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        },
      );
      await User.findOneAndUpdate(
        { spotifyId: userData.id },
        {
          spotifyId: userData.id,
          email: userData.email,
          displayName: userData.display_name,
        },
        { upsert: true, new: true },
      );
    } catch (dbError) {
      console.error("Error saving user:", dbError);
    }

    const params = querystring.stringify({
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token,
      expires_in: tokenResponse.data.expires_in,
      user_id: spotifyUserId,
    });

    response.redirect(`${CLIENT_URL}/#${params}`);
  } catch (error) {
    console.error(error);
    response.redirect(`${CLIENT_URL}?error=invalid_token`);
  }
});

app.get("/api/playlists", async (request, response) => {
  console.log("Pobieranie playlist");
  try {
    const access_token = getAccessToken(request);
    const playlistsResponse = await axios.get(
      "https://api.spotify.com/v1/me/playlists",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    response.json(playlistsResponse.data);
    console.log("Poprawnie pobrano playlisty");
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch playlists" });
  }
});

app.get("/api/playlists/:id", async (request, response) => {
  try {
    const access_token = getAccessToken(request);
    const playlist = await axios.get(
      `https://api.spotify.com/v1/playlists/${request.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    response.json(playlist.data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch playlist" });
  }
});

app.get("/api/playlists/:id/tracks", async (request, response) => {
  try {
    const playlistId = request.params.id;
    const access_token = getAccessToken(request);
    const tracksResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    console.log(`Pobrano dane playlisty ${playlistId}`);
    response.json(tracksResponse.data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch playlist tracks" });
  }
});

app.get("/api/tracks/:id", async (request, response) => {
  console.log("Pobieranie utworu");
  try {
    const trackId = request.params.id;
    const access_token = getAccessToken(request);
    const tracksResponse = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    console.log(`Pobrano dane utworu ${trackId}`);
    response.json(tracksResponse.data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch track" });
  }
});

app.get("/api/favorites", async (request, response) => {
  try {
    const favorites = await Favorite.find();
    response.json(favorites);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to fetch favorites" });
  }
});

app.post("/api/favorites", async (request, response) => {
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

app.delete("/api/favorites/:id", async (request, response) => {
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

app.get("/api/users", async (request, response) => {
  try {
    const users = await User.find();
    response.json(users);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users", async (request, response) => {
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

app.delete("/api/users/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const user = await User.findById(id);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }
    await User.deleteOne({ _id: id });
    response.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to delete user" });
  }
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
