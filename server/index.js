const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const db = require("./database");

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const API_BASE = process.env.API_BASE;

app.use(
  cors({
    origin: API_BASE,
    credentials: true,
    sameSite: "lax",
  }),
);

app.use(cookieParser());
app.use(express.json());
app.get("/", (request, response) => {
  response.send("Server is running");
});

app.get("/login", (request, response) => {
  let queryParams = {
    client_id: process.env.CLIENT_ID,
    response_type: "code",
    redirect_uri: `${API_BASE}/callback`,
    scope:
      "user-read-private user-read-email playlist-read-private user-top-read user-read-playback-state user-read-currently-playing user-read-recently-played user-read-playback-position",
  };

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify(queryParams);

  response.redirect(authUrl);
});

app.get("/api/refresh", async (request, response) => {
  try {
    const refreshToken = request.cookies.spotify_refresh_token;
    const tokenResponse = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: querystring.stringify({
        refresh_token: refreshToken,
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
    const { data: userResponse } = await axios.get(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
        },
      },
    );

    try {
      db.run(
        `INSERT OR IGNORE INTO users (spotify_id, email, display_name) VALUES (?, ?, ?)`,
        [
          userResponse.data.id,
          userResponse.data.email,
          userResponse.data.display_name,
        ],
      );
    } catch (error) {
      console.error("Error saving user:", error);
    }

    response.cookie("spotify_user_id", userResponse.data.id, {
      httpOnly: true,
      maxAge: tokenResponse.data.expires_in * 1000,
    });

    response.cookie("spotify_access_token", tokenResponse.data.access_token, {
      httpOnly: true,
      maxAge: tokenResponse.data.expires_in * 1000,
    });
    response.cookie("spotify_refresh_token", tokenResponse.data.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    response.redirect("https://final-project-cs-50x2025.vercel.app");
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to refresh token" });
  }
});

app.get("/logout", async (request, response) => {
  try {
    response.clearCookie("spotify_access_token");
    response.clearCookie("spotify_refresh_token");
    response.clearCookie("spotify_user_id");
    response.redirect("https://final-project-cs-50x2025.vercel.app");
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to logout" });
  }
});

app.get("/api/user/information", async (request, response) => {
  try {
    const access_token = request.cookies.spotify_access_token;

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
    const access_token = request.cookies.spotify_access_token;
    console.log(access_token);

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
    // console.error(error);
    response.status(500).json({ error: "Failed to get top artists" });
  }
});

app.get("/api/user/topTracks", async (request, response) => {
  try {
    const access_token = request.cookies.spotify_access_token;

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

    response.cookie("spotify_access_token", tokenResponse.data.access_token, {
      httpOnly: true,
      maxAge: tokenResponse.data.expires_in * 1000,
    });

    response.cookie("spotify_refresh_token", tokenResponse.data.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    response.redirect("https://final-project-cs-50x2025.vercel.app");
  } catch (error) {
    console.error(error);
    response.redirect(
      "https://final-project-cs-50x2025.vercel.app?error=invalid_token",
    );
  }
});

app.get("/api/playlists", async (request, response) => {
  console.log("Pobieranie playlist");
  try {
    const access_token = request.cookies.spotify_access_token;
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
    const playlist = await axios.get(
      `https://api.spotify.com/v1/playlists/${request.params.id}`,
      {
        headers: {
          Authorization: `Bearer ${request.cookies.spotify_access_token}`,
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
    const access_token = request.cookies.spotify_access_token;
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
    const access_token = request.cookies.spotify_access_token;
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

app.get("/api/favorites", (request, response) => {
  db.all("SELECT * FROM favorites", (err, rows) => {
    if (err) {
      console.error(err);
      return response.status(500).json({ error: "Failed to fetch favorites" });
    }
    response.json(rows);
  });
});

//Nie działa wczytywanie user_id z ciasteczka, a raczej ustawienie do ciasteczka user_id
app.post("/api/favorites", (request, response) => {
  try {
    const { playlist_id } = request.body;
    const user_id = request.cookies.spotify_user_id;
    db.get("SELECT id FROM users WHERE spotify_id = ?", [user_id], (user) => {
      db.run("INSERT INTO favorites (user_id, playlist_id) VALUES (?, ?)", [
        user.id,
        playlist_id,
      ]);
    });
    response
      .status(200)
      .json({ message: "Playlist added to favorites", id: this.lastID });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to add favorite" });
  }
});

app.delete("/api/favorites/:id", (request, response) => {
  console.log("Usuwanie playlisty z ulubionych");
  try {
    const { id } = request.params;
    const user_id = request.cookies.spotify_user_id;

    db.get("SELECT id FROM users WHERE spotify_id = ?", [user_id], (user) => {
      db.run("DELETE FROM favorites WHERE playlist_id = ? AND user_id = ?", [
        id,
        user.id,
      ]);
    });
    response.status(200).json({ message: "Playlist removed from favorites" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to remove favorite" });
  }
});

app.get("/api/users", (request, response) => {
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.error(err);
      return response.status(500).json({ error: "Failed to fetch users" });
    }
    response.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
