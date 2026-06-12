import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (!displayName.trim()) {
        throw new Error("Proszę wpisać imię");
      } else if (!email.includes("@")) {
        throw new Error("Proszę wpisać poprawny adres email");
      } else if (password.length < 6) {
        throw new Error("Hasło musi mieć co najmniej 6 znaków");
      } else if (password !== confirmPassword) {
        throw new Error("Hasła muszą być takie same");
      }
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie można się zarejestrować");
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="form-container">
        <div className="form-logo">🎵</div>
        <h2>Utwórz konto</h2>
        <p className="form-subtitle">Dołącz i przeglądaj swoje playlisty</p>

        {error && (
          <div className="form-error">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="form-fields">
          <div className="input-group">
            <label htmlFor="reg-name">Imię</label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              placeholder="Twoje imię"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Hasło</label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-confirm">Potwierdź hasło</label>
            <input
              id="reg-confirm"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button className="form-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>

        <p className="form-footer">
          Masz już konto?{" "}
          <button className="form-footer-link" onClick={onSwitchToLogin}>
            Zaloguj się
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;
