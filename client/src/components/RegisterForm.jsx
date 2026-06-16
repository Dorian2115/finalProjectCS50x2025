import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [errors, setErrors] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    displayName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [loading, setLoading] = useState(false);

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case "displayName":
        if (!value) {
          return "Imię jest wymagane";
        } else if (value.length < 3 || value.length > 20) {
          return "Imię musi mieć od 3 do 20 znaków";
        }
        return "";
      case "password":
        if (!value) {
          return "Hasło jest wymagane";
        } else if (value.length < 8 || value.length > 100) {
          return "Hasło musi mieć od 8 do 100 znaków";
        }
        return "";
      case "confirmPassword":
        if (!value) {
          return "Potwierdzenie hasła jest wymagane";
        } else if (value !== password) {
          return "Hasła nie są zgodne";
        }
        return "";
      case "email":
        if (!value) {
          return "Email jest wymagany";
        } else if (!/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/.test(value)) {
          return "Email jest nieprawidłowy";
        }
        return "";
    }
  };

  const handleSubmit = async () => {
    setErrors({
      email: "",
      password: "",
      displayName: "",
      confirmPassword: "",
    });
    setLoading(true);
    const validationResults = {
      displayName: validateField("displayName", displayName),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };
    if (Object.values(validationResults).some((err) => err)) {
      setErrors(validationResults);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.errors) {
          const serverErrors = data.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
          }, {});
          setErrors((prev) => ({ ...prev, ...serverErrors }));
        }
        throw new Error(data.error || "Nie można się zarejestrować");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess();
    } catch (err) {
      setErrors((prev) => ({ ...prev, general: err.message }));
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
        <div className="form-fields">
          <div className="input-group">
            <label htmlFor="reg-name">Imię</label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              placeholder="Twoje imię"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (touched.displayName) {
                  setErrors((prev) => ({
                    ...prev,
                    displayName: validateField("displayName", e.target.value),
                  }));
                }
              }}
              onBlur={() => {
                setTouched({ ...touched, displayName: true });
                setErrors((prev) => ({
                  ...prev,
                  displayName: validateField("displayName", displayName),
                }));
              }}
            />
            {touched.displayName && errors.displayName && (
              <div className="form-error">{errors.displayName}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) {
                  setErrors((prev) => ({
                    ...prev,
                    email: validateField("email", e.target.value),
                  }));
                }
              }}
              onBlur={() => {
                setTouched({ ...touched, email: true });
                setErrors((prev) => ({
                  ...prev,
                  email: validateField("email", email),
                }));
              }}
            />
            {touched.email && errors.email && (
              <div className="form-error">{errors.email}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Hasło</label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) {
                  setErrors((prev) => ({
                    ...prev,
                    password: validateField("password", e.target.value),
                  }));
                }
              }}
              onBlur={() => {
                setTouched({ ...touched, password: true });
                setErrors((prev) => ({
                  ...prev,
                  password: validateField("password", password),
                }));
              }}
            />
            {touched.password && errors.password && (
              <div className="form-error">{errors.password}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="reg-confirm">Potwierdź hasło</label>
            <input
              id="reg-confirm"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (touched.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateField(
                      "confirmPassword",
                      e.target.value,
                    ),
                  }));
                }
              }}
              onBlur={() => {
                setTouched({ ...touched, confirmPassword: true });
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword: validateField(
                    "confirmPassword",
                    confirmPassword,
                  ),
                }));
              }}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="form-error">{errors.confirmPassword}</div>
            )}
          </div>
        </div>

        {errors.general && <div className="form-error">{errors.general}</div>}
        <button
          className="form-submit"
          onClick={handleSubmit}
          disabled={loading}>
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
