import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function PlaylistDetails({ playlist, onBack }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/playlists/${playlist.id}/tracks`,
          { withCredentials: true },
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

  if (loading) return <div>Loading tracks...</div>;

  return (
    <div className="playlist-details">
      <button onClick={onBack} className="back-button">
        &larr; Back to Playlists
      </button>

      <div className="playlist-header">
        <img
          src={playlist.images[0]?.url}
          alt={playlist.name}
          className="playlist-cover-large"
        />
        <div className="playlist-title-section">
          <h2>{playlist.name}</h2>
          <div className="playlist-meta">
            {playlist.tracks.total} tracks &bull; {playlist.owner.display_name}
          </div>
        </div>
      </div>

      <table className="tracks-table">
        <thead>
          <tr>
            <th style={{ width: "50px" }}>#</th>
            <th>Title</th>
            <th>Album</th>
            <th>Date Added</th>
            <th>
              <span role="img" aria-label="duration">
                🕒
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((item, index) => {
            const track = item.track;
            if (!track) return null;

            const durationMin = Math.floor(track.duration_ms / 60000);
            const durationSec = ((track.duration_ms % 60000) / 1000).toFixed(0);
            const dateAdded = new Date(item.added_at).toLocaleDateString();

            return (
              <tr key={track.id || index}>
                <td>{index + 1}</td>
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
                <td>{track.album.name}</td>
                <td>{dateAdded}</td>
                <td>
                  {durationMin}:{durationSec < 10 ? "0" : ""}
                  {durationSec}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PlaylistDetails;
