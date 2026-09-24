const { DatabaseSync } = require("node:sqlite");
const path = require("path");
require("dotenv").config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "..", "data", "news_pulse.db");

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

module.exports = db;
