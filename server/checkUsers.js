require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\n");

  const users = await User.find({}, { email: 1, passwordHash: 1, displayName: 1 });
  console.log(`=== Wszyscy użytkownicy (${users.length}) ===`);
  users.forEach(u => {
    console.log(`  Email: ${u.email} | DisplayName: ${u.displayName} | passwordHash: ${u.passwordHash ? "OK ✓" : "BRAK ✗"}`);
  });

  // Usun uzytkownikow bez passwordHash
  const result = await User.deleteMany({ passwordHash: { $in: [null, undefined, ""] } });
  console.log(`\nUsunieto ${result.deletedCount} uszkodzonych użytkowników (bez hasła).`);

  const remaining = await User.find({}, { email: 1 });
  console.log(`\nPozostało ${remaining.length} poprawnych użytkowników.`);

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
