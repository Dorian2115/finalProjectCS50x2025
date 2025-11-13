const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const querystring = require("querystring");

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get("/", (request, response) => {
  response.send("Server is running");
});

app.get("/login", (request, response) => {
  let queryParams = {
    client_id: process.env.CLIENT_ID,
    response_type: "code",
    redirect_uri: "http://127.0.0.1:3001/callback",
    scope: "user-read-private user-read-email playlist-read-private",
  };

  response.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify(queryParams)
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
