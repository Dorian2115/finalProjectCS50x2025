import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import PlaylistDetails from "./components/PlaylistDetails";
import UserDetails from "./components/UserDetails";

function App() {
  const [playlists, setPlaylists] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [view, setView] = useState("list");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const API_LOGIN = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playlistsRes, favoritesRes] = await Promise.all([
          axios.get(`${API_BASE}/playlists`, {
            withCredentials: true,
          }),
          axios.get(`${API_BASE}/favorites`, {
            withCredentials: true,
          }),
        ]);

        setPlaylists(playlistsRes.data.items);
        setFavorites(favoritesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        // If 401, it means not logged in, which is fine
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
        await axios.delete(`${API_BASE}/favorites/${playlist.id}`, {
          withCredentials: true,
        });
        setFavorites(
          favorites.filter((fav) => fav.playlist_id !== playlist.id),
        );
      } else {
        const newFav = {
          playlist_id: playlist.id,
          playlist_name: playlist.name,
          playlist_image: playlist.images[0]?.url,
        };
        await axios.post(`${API_BASE}/favorites`, newFav, {
          withCredentials: true,
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
                <a href={`${API_BASE}/logout`} className="logout-button">
                  Wyloguj
                </a>
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
            <a href={`${API_LOGIN}/login`} className="login-button">
              Zaloguj się przez Spotify
            </a>
          </div>
        }
      </header>
    </div>
  );
}

export default App;
