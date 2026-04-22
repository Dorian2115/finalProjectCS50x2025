const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const db = require("./database");

dotenv.config();

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

app.use(cookieParser());
app.use(express.json());
app.get("/", (request, response) => {
  response.send("Server is running");
});

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
      const stmt = db.prepare(
        `INSERT OR IGNORE INTO users (spotify_id, email, display_name) VALUES (?, ?, ?)`,
      );
      stmt.run(
        userResponse.data.id,
        userResponse.data.email,
        userResponse.data.display_name,
      );
    } catch (error) {
      console.error("Error saving user:", error);
    }

    response.cookie("spotify_user_id", userResponse.data.id, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: tokenResponse.data.expires_in * 1000,
    });

    response.cookie("spotify_access_token", tokenResponse.data.access_token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: tokenResponse.data.expires_in * 1000,
    });
    response.cookie("spotify_refresh_token", tokenResponse.data.refresh_token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    response.redirect(CLIENT_URL);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to refresh token" });
  }
});

app.get("/logout", async (request, response) => {
  try {
    response.clearCookie("spotify_access_token", {
      sameSite: "none",
      secure: true,
    });
    response.clearCookie("spotify_refresh_token", {
      sameSite: "none",
      secure: true,
    });
    response.clearCookie("spotify_user_id", { sameSite: "none", secure: true });
    response.redirect(CLIENT_URL);
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
      sameSite: "none",
      secure: true,
      maxAge: tokenResponse.data.expires_in * 1000,
    });

    response.cookie("spotify_refresh_token", tokenResponse.data.refresh_token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    response.redirect(CLIENT_URL);
  } catch (error) {
    console.error(error);
    response.redirect(`${CLIENT_URL}?error=invalid_token`);
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
  try {
    const rows = db.prepare("SELECT * FROM favorites").all();
    response.json(rows);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to fetch favorites" });
  }
});

//Nie działa wczytywanie user_id z ciasteczka, a raczej ustawienie do ciasteczka user_id
app.post("/api/favorites", (request, response) => {
  try {
    const { playlist_id } = request.body;
    const user_id = request.cookies.spotify_user_id;
    const user = db
      .prepare("SELECT id FROM users WHERE spotify_id = ?")
      .get(user_id);
    const result = db
      .prepare("INSERT INTO favorites (user_id, playlist_id) VALUES (?, ?)")
      .run(user.id, playlist_id);
    response.status(200).json({
      message: "Playlist added to favorites",
      id: result.lastInsertRowid,
    });
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

    const user = db
      .prepare("SELECT id FROM users WHERE spotify_id = ?")
      .get(user_id);
    db.prepare(
      "DELETE FROM favorites WHERE playlist_id = ? AND user_id = ?",
    ).run(id, user.id);
    response.status(200).json({ message: "Playlist removed from favorites" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to remove favorite" });
  }
});

app.get("/api/users", (request, response) => {
  try {
    const rows = db.prepare("SELECT * FROM users").all();
    response.json(rows);
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: "Failed to fetch users" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
