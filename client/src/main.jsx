import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";
import axios from "axios";

const API_BASE = (import.meta.env.API_URL || "http://localhost:3001").replace(/\/+$/, "");
const SPOTIFY_KEYS = ["spotify_access_token", "spotify_refresh_token", "spotify_token_expiry"];
let refreshing = null; // shared so parallel requests trigger one refresh

function refreshSpotifyToken() {
  refreshing ??= axios
    .post(`${API_BASE}/api/spotify/refresh`, {
      refresh_token: localStorage.getItem("spotify_refresh_token"),
    })
    .then(({ data }) => {
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem("spotify_refresh_token", data.refresh_token);
      localStorage.setItem("spotify_token_expiry", Date.now() + data.expires_in * 1000);
      return data.access_token;
    })
    .catch((err) => {
      SPOTIFY_KEYS.forEach((k) => localStorage.removeItem(k));
      console.error("Spotify token refresh failed:", err);
      return null;
    })
    .finally(() => (refreshing = null));
  return refreshing;
}

axios.interceptors.request.use(async (config) => {
  const isSpotify = config.url?.includes("/api/spotify/") && !config.url.includes("/refresh");
  const expiry = Number(localStorage.getItem("spotify_token_expiry"));
  if (isSpotify && localStorage.getItem("spotify_refresh_token") && Date.now() > expiry - 60_000) {
    const token = await refreshSpotifyToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
