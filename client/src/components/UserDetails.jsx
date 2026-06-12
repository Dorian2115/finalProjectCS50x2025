import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getAuthHeaders() {
  const token = localStorage.getItem("spotify_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function UserDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [userInfoRes, topArtistsRes, topTracksRes] = await Promise.all([
          axios.get(`${API_BASE}/api/spotify/user/information`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${API_BASE}/api/spotify/user/topArtists`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${API_BASE}/api/spotify/user/topTracks`, {
            headers: getAuthHeaders(),
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
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <span>Ładowanie profilu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <p>Błąd podczas ładowania profilu.</p>
      </div>
    );
  }

  return (
    <div className="user-profile">
      {/* Hero Section */}
      <div className="profile-hero">
        <div className="profile-avatar-wrapper">
          {user.images?.[0]?.url ? (
            <img
              src={user.images[0].url}
              alt="Avatar"
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">👤</div>
          )}
        </div>
        <div className="profile-info-text">
          <div className="profile-label">Profil Spotify</div>
          <h2>{user.display_name}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="profile-stats">
            {user.top_artists && (
              <div className="profile-stat">
                <span className="profile-stat-value">{user.top_artists.length}</span>
                <span className="profile-stat-label">Top Artyści</span>
              </div>
            )}
            {user.top_tracks && (
              <div className="profile-stat">
                <span className="profile-stat-value">{user.top_tracks.length}</span>
                <span className="profile-stat-label">Top Utwory</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Artists & Tracks */}
      <div className="profile-sections">
        <div className="profile-section-card">
          <h3 className="section-title">🎤 Top Artyści</h3>
          {user.top_artists && user.top_artists.length > 0 ? (
            <ul className="top-list">
              {user.top_artists.slice(0, 10).map((artist, index) => (
                <li key={artist.id} className="top-list-item">
                  <span className={`item-rank ${index < 3 ? "top-3" : ""}`}>
                    #{index + 1}
                  </span>
                  {artist.images?.[0]?.url && (
                    <img
                      className="item-thumb round"
                      src={artist.images[0].url}
                      alt={artist.name}
                    />
                  )}
                  <div className="item-info">
                    <div className="item-name">{artist.name}</div>
                    {artist.genres?.[0] && (
                      <div className="item-sub">{artist.genres[0]}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">🎤</span>
              <p>Brak danych o ulubionych artystach.</p>
            </div>
          )}
        </div>

        <div className="profile-section-card">
          <h3 className="section-title">🎵 Top Utwory</h3>
          {user.top_tracks && user.top_tracks.length > 0 ? (
            <ul className="top-list">
              {user.top_tracks.slice(0, 10).map((track, index) => (
                <li key={track.id} className="top-list-item">
                  <span className={`item-rank ${index < 3 ? "top-3" : ""}`}>
                    #{index + 1}
                  </span>
                  {track.album?.images?.[2]?.url && (
                    <img
                      className="item-thumb"
                      src={track.album.images[2].url}
                      alt={track.name}
                    />
                  )}
                  <div className="item-info">
                    <div className="item-name">{track.name}</div>
                    <div className="item-sub">
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon">🎵</span>
              <p>Brak danych o ulubionych utworach.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetails;
