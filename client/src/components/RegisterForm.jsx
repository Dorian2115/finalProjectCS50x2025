import { useState } from "react";

function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const handleSubmit = async () => {
    setError("");
    try {
      if (!email.includes("@")) {
        throw new Error("Proszę wpisać poprawny adres email");
      } else if (password.length < 6) {
        throw new Error("Hasło musi mieć co najmniej 6 znaków");
      } else if (!displayName.trim()) {
        throw new Error("Proszę wpisać imię");
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
    }
  };

  return (
    <div className="form-container">
      <h2>Rejestracja</h2>

      {error && <p className="error">{error}</p>}
      <input
        type="text"
        placeholder="Imię"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="Potwierdź hasło"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={handleSubmit}>Zarejestruj się</button>

      <p>
        Masz już konto? <span onClick={onSwitchToLogin}>Zaloguj się</span>
      </p>
    </div>
  );
}

export default RegisterForm;
