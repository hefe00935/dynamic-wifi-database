import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'data', 'wifi.db')

// Ensure data directory exists
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}

export function initDb() {
  const db = getDb()
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS wifis (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      user_id TEXT,
      reported_count INTEGER DEFAULT 0,
      last_reported_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_wifis_status ON wifis(status);
    CREATE INDEX IF NOT EXISTS idx_wifis_location ON wifis(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_wifis_user_id ON wifis(user_id);
    CREATE INDEX IF NOT EXISTS idx_wifis_created_at ON wifis(created_at DESC);

    CREATE TABLE IF NOT EXISTS admin_users (
      user_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_submission_limits (
      user_id TEXT PRIMARY KEY,
      submission_count INTEGER DEFAULT 0,
      last_submission_at TEXT,
      reset_at TEXT NOT NULL DEFAULT (datetime('now', '+1 day')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS banned_users (
      user_id TEXT PRIMARY KEY,
      reason TEXT,
      banned_at TEXT NOT NULL DEFAULT (datetime('now')),
      banned_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (banned_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_banned_users_banned_at ON banned_users(banned_at DESC);

    CREATE TRIGGER IF NOT EXISTS update_wifis_updated_at 
      AFTER UPDATE ON wifis
      FOR EACH ROW
      BEGIN
        UPDATE wifis SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
  `)
}

// Initialize database on import
if (typeof window === 'undefined') {
  initDb()
}

