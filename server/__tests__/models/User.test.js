const User = require("../../models/User.js");

/*
[ ] Favorite bez playlistId / playlistName / userId → błąd
[ ] Favorite z userId: "nie-objectid" → błąd castowania
*/

test("Nowy User bez displayName się nie utworzy", () => {
  const user = new User({
    spotifyId: "123",
    displayName: "",
    email: "test@test.pl",
    passwordHash: "hash",
  });
  const error = user.validateSync();
  expect(error.errors.displayName).toBeDefined();
});

test("Nowy User bez email się nie utworzy", () => {
  const user = new User({
    spotifyId: "123",
    displayName: "Test User",
    email: "",
    passwordHash: "hash",
  });
  const error = user.validateSync();
  expect(error.errors.email).toBeDefined();
});

test("Nowy User się  utworzy", () => {
  const user = new User({
    spotifyId: "123",
    displayName: "Test User",
    email: "test@test.pl",
    passwordHash: "hash",
  });
  const error = user.validateSync();
  expect(error).toBeUndefined();
});
