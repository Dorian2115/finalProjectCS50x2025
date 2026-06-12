import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getAuthHeaders() {
  const token = localStorage.getItem("spotify_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDuration(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function PlaylistDetails({ playlist, onBack }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/spotify/playlists/${playlist.id}/tracks`,
          { headers: getAuthHeaders() },
        );
        setTracks(response.data.items);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlist.id]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>Ładowanie utworów...</span>
      </div>
    );
  }

  return (
    <div className="playlist-details">
      <button onClick={onBack} className="back-button">
        ← Powrót do playlist
      </button>

      {/* Hero */}
      <div className="playlist-hero">
        <img
          src={playlist.images[0]?.url}
          alt={playlist.name}
          className="playlist-cover-large"
        />
        <div className="playlist-hero-info">
          <div className="playlist-hero-label">Playlista</div>
          <h2>{playlist.name}</h2>
          <div className="playlist-meta">
            <span>{playlist.owner.display_name}</span>
            <span className="playlist-meta-dot">•</span>
            <span>{playlist.tracks.total} utworów</span>
          </div>
        </div>
      </div>

      {/* Tracks Table */}
      <div className="tracks-table-wrapper">
        <table className="tracks-table">
          <thead>
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th>Tytuł</th>
              <th>Album</th>
              <th>Data dodania</th>
              <th>🕒</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((item, index) => {
              const track = item.track;
              if (!track) return null;
              const dateAdded = new Date(item.added_at).toLocaleDateString("pl-PL");

              return (
                <tr key={track.id || index}>
                  <td className="track-num">{index + 1}</td>
                  <td>
                    <div className="track-main-info">
                      <img
                        src={track.album.images[2]?.url}
                        alt={track.album.name}
                        className="track-cover-small"
                      />
                      <div>
                        <div className="track-name-text">{track.name}</div>
                        <div className="track-artist-text">
                          {track.artists.map((a) => a.name).join(", ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="track-album-text">{track.album.name}</td>
                  <td className="track-date-text">{dateAdded}</td>
                  <td className="track-duration">
                    {formatDuration(track.duration_ms)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PlaylistDetails;
