import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import PlaylistDetails from "./components/PlaylistDetails";
import UserDetails from "./components/UserDetails";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getAuthHeaders() {
  const token = localStorage.getItem("spotify_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getAccessToken() {
  const token = localStorage.getItem("token");
  return token ? token : null;
}

function App() {
  const [playlists, setPlaylists] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [view, setView] = useState("login");

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresIn = params.get("expires_in");
      const userId = params.get("user_id");

      if (accessToken) {
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_refresh_token", refreshToken);
        localStorage.setItem(
          "spotify_token_expiry",
          Date.now() + expiresIn * 1000,
        );
        if (userId) {
          localStorage.setItem("spotify_user_id", userId);
        }
        setTimeout(() => {
          window.history.replaceState(null, "", window.location.pathname);
        }, 100);
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
          axios.get(`${API_BASE}/api/spotify/playlists`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${API_BASE}/api/favorites`, {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
              token: getAccessToken(),
            },
          }),
        ]);

        setPlaylists(playlistsRes.data.items);
        setFavorites(favoritesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
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
      const user = localStorage.getItem("user");
      if (isFav) {
        await axios.delete(`${API_BASE}/api/favorites/${playlist.id}`, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
          data: { user_id: user.id },
        });
        setFavorites(
          favorites.filter((fav) => fav.playlist_id !== playlist.id),
        );
      } else {
        const newFav = {
          playlist_id: playlist.id,
          playlist_name: playlist.name,
          playlist_image: playlist.images[0]?.url,
          user_id: user.id,
        };
        await axios.post(`${API_BASE}/api/favorites`, newFav, {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
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
        : view === "login" ?
          <LoginForm
            onSuccess={() => setView("list")}
            onSwitchToRegister={() => setView("register")}
          />
        : view === "register" ?
          <RegisterForm
            onSuccess={() => setView("login")}
            onSwitchToLogin={() => setView("login")}
          />
        : <div>
            <h1>Witaj w Aplikacji do Przeglądania Playlist</h1>
            <p>Aby kontynuować, połącz swoje konto Spotify.</p>
            <a href={`${API_BASE}/api/spotify/login`} className="login-button">
              Zaloguj się przez Spotify
            </a>
            <p>
              Masz konto w aplikacji?{" "}
              <span onClick={() => setView("login")}>Zaloguj się</span>
            </p>
          </div>
        }
      </header>
    </div>
  );
}

export default App;
