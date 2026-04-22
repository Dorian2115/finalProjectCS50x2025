const Database = require("better-sqlite3");

const db = new Database("./database.db");

db.exec(
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, spotify_id TEXT UNIQUE, email TEXT, display_name TEXT)"
);
db.exec(
  "CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, playlist_id TEXT, FOREIGN KEY (user_id) REFERENCES users (id))"
);

module.exports = db;
