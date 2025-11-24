import { useState, useEffect } from "react";
import axios from "axios";

function PlaylistDetails({ playlist, onBack }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:3001/api/playlists/${playlist.id}/tracks`,
          { withCredentials: true }
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
      <h2>{playlist.name}</h2>
      <div className="tracks-list">
        {tracks.map((item, index) => {
          const track = item.track;
          return (
            <div key={index} className="track-item">
              <img
                src={track.album.images[2]?.url}
                alt={track.album.name}
                width="40"
                height="40"
              />
              <div className="track-info">
                <div className="track-name">{track.name}</div>
                <div className="track-artist">
                  {track.artists.map((a) => a.name).join(", ")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PlaylistDetails;
