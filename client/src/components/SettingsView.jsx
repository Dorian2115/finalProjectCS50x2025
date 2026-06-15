import React from "react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// widok ustawien - edycja profilu, zmiana hasla, integracja spotify
function SettingsView() {
  const userData = JSON.parse(localStorage.getItem("user")) || {};

  const [spotifyConnected, setSpotifyConnected] = useState(
    !!localStorage.getItem("spotify_access_token"),
  );

  // stan formularza profilu
  const [displayName, setDisplayName] = useState(
    userData.displayName || "",
  );
  const [email, setEmail] = useState(userData.email || "");
  const [profileErrors, setProfileErrors] = useState({
    displayName: "",
    email: "",
  });
  const [profileTouched, setProfileTouched] = useState({
    displayName: false,
    email: false,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  // stan formularza hasla
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // inicjal na awatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  // walidacja pol profilu
  const validateProfileField = (fieldName, value) => {
    switch (fieldName) {
      case "displayName":
        if (!value) return "Nazwa jest wymagana";
        if (value.length < 3 || value.length > 20)
          return "Nazwa musi mieć od 3 do 20 znaków";
        return "";
      case "email":
        if (!value) return "Email jest wymagany";
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]+$/.test(value))
          return "Email jest nieprawidłowy";
        return "";
      default:
        return "";
    }
  };

  // walidacja pol hasla
  const validatePasswordField = (fieldName, value) => {
    switch (fieldName) {
      case "currentPassword":
        if (!value) return "Aktualne hasło jest wymagane";
        return "";
      case "newPassword":
        if (!value) return "Nowe hasło jest wymagane";
        if (value.length < 8 || value.length > 100)
          return "Nowe hasło musi mieć od 8 do 100 znaków";
        return "";
      case "confirmNewPassword":
        if (!value) return "Potwierdzenie hasła jest wymagane";
        if (value !== newPassword) return "Hasła nie są zgodne";
        return "";
      default:
        return "";
    }
  };

  // zapis profilu - PUT /api/auth/profile
  const handleProfileSubmit = async () => {
    setProfileSuccess("");
    const validationResults = {
      displayName: validateProfileField("displayName", displayName),
      email: validateProfileField("email", email),
    };

    if (Object.values(validationResults).some((err) => err)) {
      setProfileErrors(validationResults);
      setProfileTouched({ displayName: true, email: true });
      return;
    }

    setProfileLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie udało się zapisać zmian");
      }

      const data = await response.json();

      // aktualizacja localstorage
      const currentUser = JSON.parse(localStorage.getItem("user")) || {};
      const updatedUser = { ...currentUser, ...data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfileSuccess("Profil został zaktualizowany pomyślnie!");
      setProfileErrors({ displayName: "", email: "" });

      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err) {
      setProfileErrors((prev) => ({ ...prev, general: err.message }));
    } finally {
      setProfileLoading(false);
    }
  };

  // zmiana hasla - PUT /api/auth/password
  const handlePasswordSubmit = async () => {
    setPasswordSuccess("");
    const validationResults = {
      currentPassword: validatePasswordField(
        "currentPassword",
        currentPassword,
      ),
      newPassword: validatePasswordField("newPassword", newPassword),
      confirmNewPassword: validatePasswordField(
        "confirmNewPassword",
        confirmNewPassword,
      ),
    };

    if (Object.values(validationResults).some((err) => err)) {
      setPasswordErrors(validationResults);
      setPasswordTouched({
        currentPassword: true,
        newPassword: true,
        confirmNewPassword: true,
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie udało się zmienić hasła");
      }

      setPasswordSuccess("Hasło zostało zmienione pomyślnie!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPasswordTouched({
        currentPassword: false,
        newPassword: false,
        confirmNewPassword: false,
      });

      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err) {
      setPasswordErrors((prev) => ({ ...prev, general: err.message }));
    } finally {
      setPasswordLoading(false);
    }
  };

  // rozlaczenie spotify
  const handleSpotifyLogout = async () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_token_expiry");
    localStorage.removeItem("spotify_user_id");
    setSpotifyConnected(false);
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>Ustawienia konta</h2>
        <p className="settings-subtitle">
          Zarządzaj swoim profilem oraz integracją z serwisami zewnętrznymi.
        </p>
      </div>

      <div className="settings-grid">
        {/* karta edycji profilu */}
        <div className="settings-card">
          <div className="card-header">
            <h3>👤 Edytuj Profil</h3>
          </div>

          <div className="settings-form">
            <div className="settings-avatar-row">
              {userData.profileImageUrl ? (
                <img
                  src={userData.profileImageUrl}
                  alt="Profile"
                  className="settings-avatar"
                />
              ) : (
                <div className="settings-avatar-placeholder">
                  {getInitials(displayName || userData.username)}
                </div>
              )}
            </div>

            {profileSuccess && (
              <div className="form-success">
                <span>✅</span> {profileSuccess}
              </div>
            )}

            {profileErrors.general && (
              <div className="form-error">
                <span>⚠</span> {profileErrors.general}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="settings-displayName">Nazwa wyświetlana</label>
              <input
                id="settings-displayName"
                className={`form-input ${profileTouched.displayName && profileErrors.displayName ? "input-error" : ""}`}
                type="text"
                placeholder="Twoja nazwa"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (profileTouched.displayName) {
                    setProfileErrors((prev) => ({
                      ...prev,
                      displayName: validateProfileField(
                        "displayName",
                        e.target.value,
                      ),
                    }));
                  }
                }}
                onBlur={() => {
                  setProfileTouched((prev) => ({
                    ...prev,
                    displayName: true,
                  }));
                  setProfileErrors((prev) => ({
                    ...prev,
                    displayName: validateProfileField(
                      "displayName",
                      displayName,
                    ),
                  }));
                }}
              />
              {profileTouched.displayName && profileErrors.displayName && (
                <div className="field-error">{profileErrors.displayName}</div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="settings-email">Adres Email</label>
              <input
                id="settings-email"
                className={`form-input ${profileTouched.email && profileErrors.email ? "input-error" : ""}`}
                type="email"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (profileTouched.email) {
                    setProfileErrors((prev) => ({
                      ...prev,
                      email: validateProfileField("email", e.target.value),
                    }));
                  }
                }}
                onBlur={() => {
                  setProfileTouched((prev) => ({ ...prev, email: true }));
                  setProfileErrors((prev) => ({
                    ...prev,
                    email: validateProfileField("email", email),
                  }));
                }}
              />
              {profileTouched.email && profileErrors.email && (
                <div className="field-error">{profileErrors.email}</div>
              )}
            </div>

            <button
              className="form-submit"
              onClick={handleProfileSubmit}
              disabled={profileLoading}>
              {profileLoading ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </div>

        {/* karta zmiany hasla */}
        <div className="settings-card">
          <div className="card-header">
            <h3>🔒 Zmień Hasło</h3>
          </div>

          <div className="settings-form">
            {passwordSuccess && (
              <div className="form-success">
                <span>✅</span> {passwordSuccess}
              </div>
            )}

            {passwordErrors.general && (
              <div className="form-error">
                <span>⚠</span> {passwordErrors.general}
              </div>
            )}

            <div className="input-group">
              <label htmlFor="settings-current-password">Aktualne hasło</label>
              <input
                id="settings-current-password"
                className={`form-input ${passwordTouched.currentPassword && passwordErrors.currentPassword ? "input-error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordTouched.currentPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      currentPassword: validatePasswordField(
                        "currentPassword",
                        e.target.value,
                      ),
                      general: "",
                    }));
                  }
                }}
                onBlur={() => {
                  setPasswordTouched((prev) => ({
                    ...prev,
                    currentPassword: true,
                  }));
                  setPasswordErrors((prev) => ({
                    ...prev,
                    currentPassword: validatePasswordField(
                      "currentPassword",
                      currentPassword,
                    ),
                  }));
                }}
              />
              {passwordTouched.currentPassword &&
                passwordErrors.currentPassword && (
                  <div className="field-error">
                    {passwordErrors.currentPassword}
                  </div>
                )}
            </div>

            <div className="input-group">
              <label htmlFor="settings-new-password">Nowe hasło</label>
              <input
                id="settings-new-password"
                className={`form-input ${passwordTouched.newPassword && passwordErrors.newPassword ? "input-error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordTouched.newPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      newPassword: validatePasswordField(
                        "newPassword",
                        e.target.value,
                      ),
                    }));
                  }
                }}
                onBlur={() => {
                  setPasswordTouched((prev) => ({
                    ...prev,
                    newPassword: true,
                  }));
                  setPasswordErrors((prev) => ({
                    ...prev,
                    newPassword: validatePasswordField(
                      "newPassword",
                      newPassword,
                    ),
                  }));
                }}
              />
              {passwordTouched.newPassword && passwordErrors.newPassword && (
                <div className="field-error">{passwordErrors.newPassword}</div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="settings-confirm-password">
                Potwierdź nowe hasło
              </label>
              <input
                id="settings-confirm-password"
                className={`form-input ${passwordTouched.confirmNewPassword && passwordErrors.confirmNewPassword ? "input-error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  if (passwordTouched.confirmNewPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      confirmNewPassword: validatePasswordField(
                        "confirmNewPassword",
                        e.target.value,
                      ),
                    }));
                  }
                }}
                onBlur={() => {
                  setPasswordTouched((prev) => ({
                    ...prev,
                    confirmNewPassword: true,
                  }));
                  setPasswordErrors((prev) => ({
                    ...prev,
                    confirmNewPassword: validatePasswordField(
                      "confirmNewPassword",
                      confirmNewPassword,
                    ),
                  }));
                }}
              />
              {passwordTouched.confirmNewPassword &&
                passwordErrors.confirmNewPassword && (
                  <div className="field-error">
                    {passwordErrors.confirmNewPassword}
                  </div>
                )}
            </div>

            <button
              className="form-submit"
              onClick={handlePasswordSubmit}
              disabled={passwordLoading}>
              {passwordLoading ? "Zmienianie..." : "Zmień hasło"}
            </button>
          </div>
        </div>
      </div>

      {/* karta integracji spotify */}
      <div className="settings-card settings-card-full">
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
  );
}

export default SettingsView;
