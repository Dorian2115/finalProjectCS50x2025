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

export { validateField };
