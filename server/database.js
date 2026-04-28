const Database = require("better-sqlite3");

const db = new Database("./database.db");

// Create tables if they don't exist
db.exec(
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, spotify_id TEXT UNIQUE, email TEXT, display_name TEXT)"
);
db.exec(
  `CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    playlist_id TEXT,
    playlist_name TEXT,
    playlist_image TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`
);

// Migration: add playlist_name and playlist_image columns if they don't exist yet
// (needed for databases created before these columns were added)
const existingColumns = db.pragma("table_info(favorites)").map((col) => col.name);

if (!existingColumns.includes("playlist_name")) {
  db.exec("ALTER TABLE favorites ADD COLUMN playlist_name TEXT");
}
if (!existingColumns.includes("playlist_image")) {
  db.exec("ALTER TABLE favorites ADD COLUMN playlist_image TEXT");
}

module.exports = db;
