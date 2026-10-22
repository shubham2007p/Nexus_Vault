import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'vault.db');

export const db = new sqlite3.Database(dbPath);

export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export async function initDb() {
  await dbRun(`PRAGMA foreign_keys = ON;`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      target_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
      target_title TEXT NOT NULL,
      relationship TEXT,
      context TEXT,
      is_ai_suggested INTEGER DEFAULT 0,
      status TEXT DEFAULT 'accepted',
      created_at TEXT
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      raw_response TEXT,
      created_at TEXT
    );
  `);

  // Migration: add companion note columns to files table if not already present
  const fileColumns = await dbAll(`PRAGMA table_info(files);`);
  const colNames = new Set(fileColumns.map((c) => c.name));
  if (!colNames.has('note_type')) {
    await dbRun(`ALTER TABLE files ADD COLUMN note_type TEXT DEFAULT 'raw';`);
  }
  if (!colNames.has('raw_file_id')) {
    await dbRun(`ALTER TABLE files ADD COLUMN raw_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;`);
  }
  if (!colNames.has('formal_file_id')) {
    await dbRun(`ALTER TABLE files ADD COLUMN formal_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;`);
  }

  // Table to store history of formal note syntheses, prompt versions, and structured responses
  await dbRun(`
    CREATE TABLE IF NOT EXISTS synthesis_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      formal_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
      version_number INTEGER NOT NULL DEFAULT 1,
      prompt_version TEXT NOT NULL,
      model TEXT NOT NULL,
      raw_input TEXT NOT NULL,
      structured_output TEXT,
      rendered_markdown TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  console.log('Database initialized successfully at:', dbPath);
}
