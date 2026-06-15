import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import PlaylistDetails from "./components/PlaylistDetails";
import UserDetails from "./components/UserDetails";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { ThemeProvider, useTheme } from "./ThemeContext.jsx";
import SettingsView from "./components/SettingsView.jsx";

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
  const { theme, toggleTheme } = useTheme();

  /**
   * Inicjalizacja widoku na podstawie stanu localStorage.
   * Jeśli użytkownik posiada ważny token JWT → widok "list" (playlisty).
   * W przeciwnym razie → widok "login".
   *
   * DLACZEGO: Bez tego, po powrocie ze Spotify OAuth callback
   * (pełne przeładowanie strony), stan view resetuje się do "login"
   * mimo że JWT jest wciąż ważny w localStorage.
   */
  const [view, setView] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? "list" : "login";
  });

  /**
   * Klucz wymuszający ponowne pobranie danych.
   * Inkrementowany po połączeniu konta Spotify (callback z hash).
   * Powoduje ponowne uruchomienie useEffect fetchującego playlisty.
   */
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Obsługa powrotu ze Spotify OAuth callback.
   * Spotify przekierowuje na CLIENT_URL/#access_token=...&refresh_token=...
   * Ten useEffect odczytuje tokeny z URL hash i zapisuje je w localStorage.
   * Po zapisaniu — ustawia view na "list" i wymusza refetch playlist.
   */
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
        try {
          window.history.replaceState(null, "", window.location.pathname);
        } catch (e) {
          console.log("Error clearing URL hash:", e);
        }

        // Po zapisaniu tokenów Spotify — przejdź do widoku playlist
        // i wymuś ponowne pobranie danych (refetch)
        setView("list");
        setRefreshKey((k) => k + 1);
      }
    }
  }, []);

  /**
   * Pobieranie playlist i ulubionych z API.
   * Uruchamiane przy starcie oraz po zmianie refreshKey
   * (np. po połączeniu konta Spotify).
   */
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
  }, [refreshKey]);

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
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("theme");
    setPlaylists(null);
    setFavorites([]);
    setView("login");
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>Ładowanie...</span>
      </div>
    );
  }

  /**
   * Logika renderowania widoków.
   *
   * Kolejność sprawdzania:
   * 1. "login"    → formularz logowania (niezalogowany)
   * 2. "register" → formularz rejestracji (niezalogowany)
   * 3. "details"  → szczegóły playlisty (zalogowany)
   * 4. "settings" → ustawienia konta (zalogowany)
   * 5. "list"     → widok playlist lub zachęta do połączenia Spotify (zalogowany)
   *
   * DLACZEGO taka kolejność: login/register są sprawdzane jako pierwsze,
   * żeby po zalogowaniu użytkownik trafiał do "list" a nie do welcome screen.
   */
  return (
    <div className="App">
      <header className="App-header">
        {view === "login" ? (
          <LoginForm
            onSuccess={() => setView("list")}
            onSwitchToRegister={() => setView("register")}
          />
        ) : view === "register" ? (
          <RegisterForm
            onSuccess={() => setView("login")}
            onSwitchToLogin={() => setView("login")}
          />
        ) : view === "details" && selectedPlaylist ? (
          <PlaylistDetails
            playlist={selectedPlaylist}
            onBack={() => setView("list")}
          />
        ) : view === "settings" ? (
          <div style={{ width: "100%", maxWidth: "1100px" }}>
            <div className="view-top-bar">
              <button onClick={() => setView("list")} className="back-button">
                ← Powrót do playlist
              </button>
              <button className="btn btn-ghost" onClick={toggleTheme}>
                {theme === "dark" ? "☀️ Jasny" : "🌙 Ciemny"}
              </button>
            </div>
            <SettingsView />
          </div>
        ) : view === "spotify-profile" ? (
          <div style={{ width: "100%", maxWidth: "1100px" }}>
            <div className="view-top-bar">
              <button onClick={() => setView("list")} className="back-button">
                ← Powrót do playlist
              </button>
              <button className="btn btn-ghost" onClick={toggleTheme}>
                {theme === "dark" ? "☀️ Jasny" : "🌙 Ciemny"}
              </button>
            </div>
            <UserDetails />
          </div>
        ) : (
          /* view === "list" — widok domyślny dla zalogowanego użytkownika */
          <div className="playlists-container">
            <div className="page-header">
              <h1>🎵 Twoje Playlisty</h1>
              <div className="header-actions">
                <button className="btn btn-ghost" onClick={toggleTheme}>
                  {theme === "dark" ? "☀️ Jasny" : "🌙 Ciemny"}
                </button>
                {localStorage.getItem("spotify_access_token") && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setView("spotify-profile")}>
                    Profil Spotify
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => setView("settings")}>
                  Ustawienia
                </button>
                <button onClick={handleLogout} className="btn btn-danger">
                  Wyloguj
                </button>
              </div>
            </div>
            <div className="playlists-grid">
              {playlists && playlists.length > 0 ? (
                playlists.map((playlist) => {
                  const isFav = favorites.some(
                    (fav) => fav.playlist_id === playlist.id,
                  );
                  return (
                    <div key={playlist.id} className="playlist-card">
                      <div
                        className="playlist-image-container"
                        onClick={() => handlePlaylistClick(playlist)}>
                        <img
                          src={playlist.images[0]?.url}
                          alt={playlist.name}
                          className="playlist-image"
                        />
                        <div className="playlist-overlay">
                          <span>Otwórz</span>
                        </div>
                      </div>
                      <div className="playlist-info">
                        <h3>{playlist.name}</h3>
                        <p>{playlist.tracks.total} utworów</p>
                      </div>
                      <div className="playlist-card-footer">
                        <button
                          className={`fav-button ${isFav ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(playlist);
                          }}
                          title={
                            isFav ? "Usuń z ulubionych" : "Dodaj do ulubionych"
                          }>
                          {isFav ? "❤️" : "🤍"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-spotify-prompt">
                  <div className="no-spotify-icon">🎵</div>
                  <h2>Połącz swoje konto Spotify</h2>
                  <p className="spotify-status-description">
                    Aby przeglądać swoje playlisty, połącz konto Spotify w
                    ustawieniach.
                  </p>
                  <button
                    className="btn-spotify"
                    onClick={() => setView("settings")}>
                    Przejdź do ustawień
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
