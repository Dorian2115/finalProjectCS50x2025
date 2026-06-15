import React from "react";
import UserDetails from "./UserDetails";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Komponent SettingsView (Widok Ustawień)
 *
 * Odpowiada za wyświetlanie panelu ustawień użytkownika.
 * Umożliwia podgląd danych lokalnego konta oraz statusu integracji z serwisem Spotify.
 * Jeśli konto Spotify jest połączone, renderuje szczegóły profilu (UserDetails).
 * W przeciwnym wypadku wyświetla dedykowany baner zachęcający do autoryzacji.
 *
 * @returns {JSX.Element} Widok ustawień użytkownika
 */
function SettingsView() {
  // Pobieramy dane zalogowanego użytkownika z pamięci lokalnej przeglądarki (localStorage)
  const userData = JSON.parse(localStorage.getItem("user")) || {};

  // Sprawdzamy czy użytkownik posiada ważny token dostępowy do API Spotify
  const [spotifyConnected, setSpotifyConnected] = useState(
    !!localStorage.getItem("spotify_access_token"),
  );

  /**
   * Generuje inicjał użytkownika na podstawie nazwy wyświetlanej lub e-maila.
   * Używane jako awatar zastępczy (fallback), gdy brak zdjęcia profilowego.
   *
   * @param {string} name - Nazwa użytkownika
   * @returns {string} Pierwsza litera nazwy
   */
  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const handleSpotifyLogout = async () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_token_expiry");
    localStorage.removeItem("spotify_user_id");
    setSpotifyConnected(false);
  };

  const handleSpotifyLogin = async () => {};

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>Ustawienia konta</h2>
        <p className="settings-subtitle">
          Zarządzaj swoim profilem oraz integracją z serwisami zewnętrznymi.
        </p>
      </div>

      {/* Siatka z kartami ustawień */}
      <div className="settings-grid">
        {/* Karta 1: Dane profilowe użytkownika w aplikacji */}
        <div className="settings-card">
          <div className="card-header">
            <h3>👤 Twój Profil</h3>
          </div>
          <div className="settings-user-info">
            {userData.profileImageUrl ? (
              <img
                src={userData.profileImageUrl}
                alt="Profile"
                className="settings-avatar"
              />
            ) : (
              <div className="settings-avatar-placeholder">
                {getInitials(userData.displayName || userData.username)}
              </div>
            )}
            <div className="settings-user-details">
              <div className="info-group">
                <span className="info-label">Nazwa użytkownika</span>
                <span className="info-value">
                  {userData.displayName || userData.username || "Brak nazwy"}
                </span>
              </div>
              <div className="info-group">
                <span className="info-label">Adres Email</span>
                <span className="info-value">
                  {userData.email || "Brak emaila"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Karta 2: Status połączenia z Spotify */}
        <div className="settings-card">
          <div className="card-header">
            <h3>🔗 Integracje</h3>
          </div>
          <div className="spotify-status-card">
            <div className="spotify-logo-wrapper">🎵</div>
            <div className="spotify-status-info">
              <h4>Spotify</h4>
              <div className="status-badge">
                {spotifyConnected ? (
                  <span className="badge badge-success">Połączono</span>
                ) : (
                  <span className="badge badge-secondary">Nie połączono</span>
                )}{" "}
                {spotifyConnected ? (
                  <button
                    onClick={handleSpotifyLogout}
                    className="badge badge-secondary">
                    Usuń połączenie ze Spotify
                  </button>
                ) : (
                  <button
                    className="badge badge-secondary"
                    onClick={() =>
                      (window.location.href = `${API_BASE}/api/spotify/login`)
                    }>
                    Połącz ze Spotify
                  </button>
                )}
              </div>

              <p className="spotify-status-description">
                {spotifyConnected
                  ? "Twoje konto Spotify zostało pomyślnie zsynchronizowane z naszą aplikacją."
                  : "Połącz swoje konto Spotify, aby przeglądać swoje playlisty, ulubionych artystów oraz utwory."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Jeśli Spotify jest połączone, wyświetlamy pod spodem szczegółowe statystyki z UserDetails */}
      {spotifyConnected && (
        <div className="spotify-details-section">
          <div className="section-divider">
            <span>Twój profil Spotify i statystyki</span>
          </div>
          <UserDetails />
        </div>
      )}
    </div>
  );
}

export default SettingsView;
