const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, spotify_access_token TEXT, spotify_refresh_token TEXT)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS favorites (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, playlist_id TEXT, FOREIGN KEY (user_id) REFERENCES users (id))"
  );
});

module.exports = db;
