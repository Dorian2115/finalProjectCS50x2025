import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import PlaylistDetails from "./components/PlaylistDetails";
import UserDetails from "./components/UserDetails";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Helper: get auth header for API requests
function getAuthHeaders() {
  const token = localStorage.getItem("spotify_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function App() {
  const [playlists, setPlaylists] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [view, setView] = useState("list");

  // On mount: check URL hash for tokens from OAuth callback
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresIn = params.get("expires_in");

      if (accessToken) {
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_refresh_token", refreshToken);
        localStorage.setItem(
          "spotify_token_expiry",
          Date.now() + expiresIn * 1000,
        );
        // Clean URL
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("spotify_access_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [playlistsRes, favoritesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/playlists`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${API_BASE}/api/favorites`),
        ]);

        setPlaylists(playlistsRes.data.items);
        setFavorites(favoritesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        // If 401/500 due to expired token, clear storage
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("spotify_access_token");
          localStorage.removeItem("spotify_refresh_token");
          localStorage.removeItem("spotify_token_expiry");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFavorite = async (playlist) => {
    const isFav = favorites.some((fav) => fav.playlist_id === playlist.id);

    try {
      if (isFav) {
        await axios.delete(`${API_BASE}/api/favorites/${playlist.id}`, {
          headers: getAuthHeaders(),
          data: { user_id: localStorage.getItem("spotify_user_id") },
        });
        setFavorites(
          favorites.filter((fav) => fav.playlist_id !== playlist.id),
        );
      } else {
        const newFav = {
          playlist_id: playlist.id,
          playlist_name: playlist.name,
          playlist_image: playlist.images[0]?.url,
          user_id: localStorage.getItem("spotify_user_id"),
        };
        await axios.post(`${API_BASE}/api/favorites`, newFav, {
          headers: getAuthHeaders(),
        });
        setFavorites([...favorites, newFav]);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorites");
    }
  };

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylist(playlist);
    setView("details");
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_token_expiry");
    localStorage.removeItem("spotify_user_id");
    setPlaylists(null);
    setFavorites([]);
    setView("list");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        {view === "details" && selectedPlaylist ?
          <PlaylistDetails
            playlist={selectedPlaylist}
            onBack={() => setView("list")}
          />
        : view === "profile" ?
          <div>
            <button onClick={() => setView("list")} className="back-button">
              &larr; Back to Playlists
            </button>
            <UserDetails />
          </div>
        : playlists ?
          <div>
            <div className="header-content">
              <h1>Twoje Playlisty Spotify</h1>
              <div>
                <button
                  className="logout-button"
                  style={{ marginRight: "10px" }}
                  onClick={() => setView("profile")}
                >
                  Profil
                </button>
                <button onClick={handleLogout} className="logout-button">
                  Wyloguj
                </button>
              </div>
            </div>
            <div className="playlists-grid">
              {playlists.map((playlist) => {
                const isFav = favorites.some(
                  (fav) => fav.playlist_id === playlist.id,
                );
                return (
                  <div key={playlist.id} className="playlist-card">
                    <div
                      className="playlist-image-container"
                      onClick={() => handlePlaylistClick(playlist)}
                    >
                      <img
                        src={playlist.images[0]?.url}
                        alt={playlist.name}
                        className="playlist-image"
                      />
                      <div className="playlist-overlay">
                        <span>View Tracks</span>
                      </div>
                    </div>
                    <div className="playlist-info">
                      <h3>{playlist.name}</h3>
                      <p>{playlist.tracks.total} tracks</p>
                      <button
                        className={`fav-button ${isFav ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(playlist);
                        }}
                      >
                        {isFav ? "❤️" : "🤍"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        : <div>
            <h1>Witaj w Aplikacji do Przeglądania Playlist</h1>
            <p>Aby kontynuować, połącz swoje konto Spotify.</p>
            <a href={`${API_BASE}/login`} className="login-button">
              Zaloguj się przez Spotify
            </a>
          </div>
        }
      </header>
    </div>
  );
}

export default App;
