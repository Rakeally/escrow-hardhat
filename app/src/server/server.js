const express = require("express");
const app = express();
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const filepath = "./db/escrows.db";

function createDbConnection() {
  const db = new sqlite3.Database(filepath, (error) => {
    if (error) {
      return console.error(error.message);
    }
    createTable(db);
  });
  console.log("Connection with SQLite has been established");
  return db;
}

app.use(cors());
app.use(express.json());

function createTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS escrows (
      id INTEGER PRIMARY KEY,
      address TEXT,
      arbiter TEXT,
      beneficiary TEXT,
      value INTEGER,
      approved BOOLEAN
    )
  `);
}

module.exports = createDbConnection();
