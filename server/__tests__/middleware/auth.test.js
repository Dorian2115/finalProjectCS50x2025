const authenticateToken = require("../../middleware/auth").authenticateToken;
const getAccessToken = require("../../middleware/auth").getAccessToken;
const jsonwebtoken = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

test("getAccessToken zwraca token przy nagłówku Bearer abc", () => {
  expect(getAccessToken({ headers: { authorization: "Bearer abc" } })).toBe(
    "abc",
  );
});
test("getAccessToken zwraca null bez nagłówka", () => {
  expect(getAccessToken({ headers: {} })).toBe(null);
});
test("getAccessToken zwraca null przy innym schemacie (Basic abc)", () => {
  expect(getAccessToken({ headers: { authorization: "Basic abc" } })).toBe(
    null,
  );
});
test("getAccessToken przypadek brzegowy: 'Bearer '(pusty token)", () => {
  expect(getAccessToken({ headers: { authorization: "Bearer " } })).toBe(null);
});

test("authenticateToken brak tokena → 401, next NIE wywołane", () => {
  const request = { headers: {} };
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  authenticateToken(request, response, next);
  expect(response.status).toHaveBeenCalledWith(401);
  expect(response.json).toHaveBeenCalledWith({
    error: "Access token is missing",
  });
  expect(next).not.toHaveBeenCalled();
});
test("authenticateToken zły / wygasły token → 403", () => {
  const request = { headers: { authorization: "Bearer invalid-token" } };
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  authenticateToken(request, response, next);
  expect(response.status).toHaveBeenCalledWith(403);
  expect(response.json).toHaveBeenCalledWith({
    error: "Invalid or expired token",
  });
  expect(next).not.toHaveBeenCalled();
});
test("authenticateToken poprawny token → request.user ustawione, next wywołane raz", () => {
  const request = {
    headers: { authorization: "" },
  };
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  request.headers.authorization = `Bearer ${jsonwebtoken.sign(
    { id: 1, name: "Test User" },
    process.env.JWT_SECRET,
  )}`;
  authenticateToken(request, response, next);
  expect(request.user).toMatchObject({ id: 1, name: "Test User" });
  expect(next).toHaveBeenCalledTimes(1);
});
