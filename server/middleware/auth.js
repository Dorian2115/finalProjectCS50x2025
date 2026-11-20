const jsonwebtoken = require("jsonwebtoken");

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

function getAccessToken(request) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token === "") {
      return null;
    }
    return token;
  }
  return null;
}

module.exports = {
  authenticateToken,
  getAccessToken,
};
