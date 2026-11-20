const Favorite = require("../../models/Favorite");
const mongoose = require("mongoose");
/*
[ ] Favorite bez playlistId / playlistName / userId → błąd
[ ] Favorite z userId: "nie-objectid" → błąd castowania
*/

test("nowy Favorite bez playlistId się nie utworzy", () => {
  const favorite = new Favorite({
    playlistId: "",
    playlistName: "Test playlist",
    playlistImage: "test.jpg",
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  });
  const error = favorite.validateSync();
  expect(error.errors.playlistId).toBeDefined();
});

test("nowy Favorite bez playlistName się nie utworzy", () => {
  const favorite = new Favorite({
    playlistId: "1",
    playlistName: "",
    playlistImage: "test.jpg",
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  });
  const error = favorite.validateSync();
  expect(error.errors.playlistName).toBeDefined();
});

test("nowy Favorite bez userId się nie utworzy", () => {
  const favorite = new Favorite({
    playlistId: "",
    playlistName: "Test playlist",
    playlistImage: "test.jpg",
    userId: {},
  });
  const error = favorite.validateSync();
  expect(error.errors.userId).toBeDefined();
});

test("nowy Favorite ze złym typem userId się nie utworzy", () => {
  const favorite = new Favorite({
    playlistId: "123",
    playlistName: "Test playlist",
    playlistImage: "test.jpg",
    userId: {
      type: "string",
      ref: "User",
      required: true,
    },
  });
  const error = favorite.validateSync();
  expect(error.errors.userId).toBeDefined();
});
