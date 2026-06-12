import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function LoginForm({ onSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (!email.includes("@")) {
        throw new Error("Proszę wpisać poprawny adres email");
      } else if (password.length < 6) {
        throw new Error("Hasło musi mieć co najmniej 6 znaków");
      }
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie można się zalogować");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="auth-page">
      <div className="form-container">
        <div className="form-logo">🎵</div>
        <h2>Witaj ponownie</h2>
        <p className="form-subtitle">Zaloguj się do swojego konta</p>

        {error && (
          <div className="form-error">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="form-fields">
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Hasło</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <button className="form-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>

        <p className="form-footer">
          Nie masz konta?{" "}
          <button className="form-footer-link" onClick={onSwitchToRegister}>
            Zarejestruj się
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
