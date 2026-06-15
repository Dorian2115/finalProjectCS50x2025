const jsonwebtoken = require("jsonwebtoken");

// weryfikacja jwt tokena
function authenticateToken(request, response, next) {
  const token = getAccessToken(request);

  if (!token) {
    return response.status(401).json({ error: "Access token is missing" });
  }
  jsonwebtoken.verify(token, process.env.JWT_SECRET, (error, user) => {
    if (error) {
      return response.status(403).json({ error: "Invalid or expired token" });
    }
    request.user = user;
    next();
  });
}

// wyciaga bearer token z headera
function getAccessToken(request) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

module.exports = {
  authenticateToken,
  getAccessToken,
};
