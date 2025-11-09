import Database from "better-sqlite3";

const db = new Database("jobs.db");

 
db.exec(`
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  state TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,               
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dlq (
  id TEXT PRIMARY KEY,
  command TEXT,
  attempts INTEGER,
  max_retries INTEGER,
  reason TEXT,
  created_at TEXT,
  failed_at TEXT
);

`);

export default db;
