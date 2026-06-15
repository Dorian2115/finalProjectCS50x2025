const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const User = require("../models/User");

const router = express.Router();

// wyciaga token z headera authorization
function getAccessToken(request) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

// przekierowanie do spotify oauth
router.get("/login", (request, response) => {
  let queryParams = {
    client_id: process.env.CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.REDIRECT_URI,
    scope:
      "user-read-private user-read-email playlist-read-private user-top-read user-read-playback-state user-read-currently-playing user-read-recently-played user-read-playback-position",
  };

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify(queryParams);

  response.redirect(authUrl);
});

// odswiezanie tokena spotify
router.post("/refresh", async (request, response) => {
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

// dane usera ze spotify
router.get("/user/information", async (request, response) => {
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

// top artysci usera
router.get("/user/topArtists", async (request, response) => {
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

// top utwory usera
router.get("/user/topTracks", async (request, response) => {
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

// callback po autoryzacji spotify - wymiana code na tokeny
router.get("/callback", async (request, response) => {
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

    // zapis usera do bazy
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
      spotifyUserId = userData.id;
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

    // redirect z tokenami w hash
    const params = querystring.stringify({
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token,
      expires_in: tokenResponse.data.expires_in,
      user_id: spotifyUserId,
    });

    response.redirect(`${process.env.CLIENT_URL}/#${params}`);
  } catch (error) {
    console.error(error);
    response.redirect(`${process.env.CLIENT_URL}?error=invalid_token`);
  }
});

// pobierz playlisty usera
router.get("/playlists", async (request, response) => {
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
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// pobierz konkretna playliste
router.get("/playlists/:id", async (request, response) => {
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

// pobierz tracki z playlisty
router.get("/playlists/:id/tracks", async (request, response) => {
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
    response.json(tracksResponse.data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch playlist tracks" });
  }
});

// pobierz pojedynczy track
router.get("/tracks/:id", async (request, response) => {
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
    response.json(tracksResponse.data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch track" });
  }
});

module.exports = router;
