const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, spotify_access_token TEXT, spotify_refresh_token TEXT)"
  );
});
db.close();

module.exports = db;
