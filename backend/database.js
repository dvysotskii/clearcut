const { Database } = require('node-sqlite3-wasm');
const path = require('path');

// На Railway данные хранятся в /app/data (Volume), локально — рядом с кодом
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'clearcut.db');

const db = new Database(DB_PATH);

db.run('PRAGMA foreign_keys = ON');

// Создаём таблицы при первом запуске
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'pro')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    plan_expires_at DATETIME NULL
  );

  CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NULL,
    ip_address TEXT NULL,
    used_at DATE DEFAULT (date('now')),
    count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, used_at),
    UNIQUE(ip_address, used_at)
  );
`);

module.exports = db;
