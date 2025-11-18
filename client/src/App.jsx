import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import axios from "axios";
import "./App.css";

function App() {
  const [playlists, setPlaylists] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:3001/api/playlists",
          {
            withCredentials: true,
          }
        );
        setPlaylists(response.data.items);
        console.log(
          "Użytkownik jest już zalogowany. Pobrano playlisty:",
          response.data.items
        );
      } catch (error) {
        console.error("Error fetching playlists:", error);
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        {playlists && playlists.length > 0 ? (
          <div>
            <h1>Twoje Playlisty Spotify</h1>
            <ul>
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  {playlist.name} {playlist.tracks.total}
                  <img
                    src={playlist.images[0]?.url}
                    alt={playlist.name}
                    width="100"
                    height="100"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h1>Witaj w Aplikacji do Przeglądania Playlist</h1>
            <p>Aby kontynuować, połącz swoje konto Spotify.</p>
            <a href="http://127.0.0.1:3001/login" className="login-button">
              Zaloguj się przez Spotify
            </a>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
