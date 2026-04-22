import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function UserDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [userInfoRes, topArtistsRes, topTracksRes] = await Promise.all([
          axios.get("${API_BASE}/api/user/information", {
            withCredentials: true,
          }),
          axios.get("${API_BASE}/api/user/topArtists", {
            withCredentials: true,
          }),
          axios.get("${API_BASE}/api/user/topTracks", {
            withCredentials: true,
          }),
        ]);
        setUser({
          ...userInfoRes.data,
          top_artists: topArtistsRes.data.items,
          top_tracks: topTracksRes.data.items,
        });
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <img
          src={user.images[0]?.url}
          alt="Avatar"
          className="profile-avatar"
        />
        <div className="profile-info">
          <h2>{user.display_name}</h2>
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      <div className="profile-sections">
        <div className="profile-section">
          <h3 className="section-title">Top Artists</h3>
          {user.top_artists && user.top_artists.length > 0 ?
            <ul className="top-artists-list">
              {user.top_artists.slice(0, 10).map((artist, index) => (
                <li key={artist.id} className="artist-item">
                  <span className="artist-rank">#{index + 1}</span>
                  <span className="artist-name">{artist.name}</span>
                  <span className="artist-image">
                    <img src={artist.images[0]?.url} alt={artist.name} />
                  </span>
                </li>
              ))}
            </ul>
          : <p style={{ color: "var(--secondary-text)" }}>
              Brak danych o ulubionych artystach.
            </p>
          }
        </div>

        <div className="profile-section">
          <h3 className="section-title">Top Tracks</h3>
          {user.top_tracks && user.top_tracks.length > 0 ?
            <ul className="top-artists-list">
              {user.top_tracks.slice(0, 10).map((track, index) => (
                <li key={track.id} className="artist-item">
                  <span className="artist-rank">#{index + 1}</span>
                  <div>
                    <div className="artist-name">{track.name}</div>
                    <div className="track-artist-text">
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                  </div>
                  <span className="artist-image">
                    <img src={track.album.images[2]?.url} alt={track.name} />
                  </span>
                </li>
              ))}
            </ul>
          : <p style={{ color: "var(--secondary-text)" }}>
              Brak danych o ulubionych utworach.
            </p>
          }
        </div>
      </div>
    </div>
  );
}

export default UserDetails;
