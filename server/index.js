const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");
const axios = require("axios");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
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
    redirect_uri: process.env.REDIRECT_URI,
    scope: "user-read-private user-read-email playlist-read-private",
  };

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify(queryParams);

  response.redirect(authUrl);
});

app.get("/callback", async (request, response) => {
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
            process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
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

    response.redirect("http://localhost:5173");
  } catch (error) {
    console.error(error);
    response.redirect("http://localhost:5173?error=invalid_token");
  }
});

app.get("/api/playlists", async (request, response) => {
  try {
    const access_token = request.cookies.spotify_access_token;
    const playlistsResponse = await axios.get(
      "https://api.spotify.com/v1/me/playlists",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    console.log(playlistsResponse.data);
    response.json(playlistsResponse.data);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Failed to fetch playlists" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
