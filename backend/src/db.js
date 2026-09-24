const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "news_pulse.db");

// Ensure the parent folder exists — on a fresh deploy (Render, etc.) this
// directory has never been created yet, since only the .gitignored .db file
// itself is excluded, not this bootstrap step.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

module.exports = db;