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

// Serialized transaction mutex so concurrent async requests never interleave BEGIN/COMMIT on sqlite3's single connection
let txQueue = Promise.resolve();

export function withTransaction(workFn) {
  const nextTx = txQueue.then(async () => {
    await dbRun('BEGIN IMMEDIATE TRANSACTION;');
    try {
      const result = await workFn();
      await dbRun('COMMIT;');
      return result;
    } catch (err) {
      try {
        await dbRun('ROLLBACK;');
      } catch (rollbackErr) {
        console.error('Transaction rollback error:', rollbackErr.message);
      }
      throw err;
    }
  });
  // Keep queue alive even if a transaction rejects
  txQueue = nextTx.catch(() => {});
  return nextTx;
}

/**
 * Synchronize a single file row into the SQLite FTS5 virtual table (vault_fts).
 */
export async function syncFileToFts(fileId) {
  if (!fileId) return;
  try {
    const file = await dbGet(
      `SELECT f.id, f.title, f.content, f.user_id, f.topic_id, t.keywords as topic_keywords
       FROM files f
       LEFT JOIN topics t ON f.topic_id = t.id
       WHERE f.id = ?`,
      [fileId]
    );

    await dbRun(`DELETE FROM vault_fts WHERE file_id = ?`, [String(fileId)]);

    if (file) {
      let keywordStr = '';
      if (file.topic_keywords) {
        try {
          const parsed = JSON.parse(file.topic_keywords);
          if (Array.isArray(parsed)) keywordStr = parsed.join(' ');
        } catch (e) {
          keywordStr = String(file.topic_keywords);
        }
      }

      await dbRun(
        `INSERT INTO vault_fts (title, content, keywords, file_id, topic_id, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          file.title || '',
          file.content || '',
          keywordStr,
          String(file.id),
          file.topic_id ? String(file.topic_id) : '',
          file.user_id || 'default_user',
        ]
      );
    }
  } catch (err) {
    console.warn(`Failed to sync file ${fileId} to vault_fts:`, err.message);
  }
}

/**
 * Remove a deleted file from the SQLite FTS5 virtual table.
 */
export async function removeFileFromFts(fileId) {
  if (!fileId) return;
  try {
    await dbRun(`DELETE FROM vault_fts WHERE file_id = ?`, [String(fileId)]);
  } catch (err) {
    console.warn(`Failed to remove file ${fileId} from vault_fts:`, err.message);
  }
}

/**
 * Rebuild / backfill vault_fts from all existing files in the database.
 */
export async function rebuildVaultFts() {
  try {
    await dbRun(`DELETE FROM vault_fts;`);
    const allFiles = await dbAll(
      `SELECT f.id, f.title, f.content, f.user_id, f.topic_id, t.keywords as topic_keywords
       FROM files f
       LEFT JOIN topics t ON f.topic_id = t.id`
    );

    for (const file of allFiles) {
      let keywordStr = '';
      if (file.topic_keywords) {
        try {
          const parsed = JSON.parse(file.topic_keywords);
          if (Array.isArray(parsed)) keywordStr = parsed.join(' ');
        } catch (e) {
          keywordStr = String(file.topic_keywords);
        }
      }
      await dbRun(
        `INSERT INTO vault_fts (title, content, keywords, file_id, topic_id, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          file.title || '',
          file.content || '',
          keywordStr,
          String(file.id),
          file.topic_id ? String(file.topic_id) : '',
          file.user_id || 'default_user',
        ]
      );
    }
  } catch (err) {
    console.warn('Error rebuilding vault_fts:', err.message);
  }
}

export async function initDb() {
  await dbRun(`PRAGMA foreign_keys = ON;`);

  // 1. Core Vault Tables
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

  // 1b. Authentication: Users & Sessions Tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Ensure default demo user exists for local exploration
  await dbRun(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, updated_at)
    VALUES ('default_user', 'demo@nexusvault.local', 'LOCAL_DEMO_GUEST', 'Demo Guest', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
  `);

  // 2. ChattyFi Knowledge Topics Table (created before files migration so topic_id FK is valid)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      summary TEXT DEFAULT '',
      keywords TEXT DEFAULT '[]',
      raw_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
      processed_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, normalized_name)
    );
  `);

  // 3. Backward-compatible migrations on files & links
  const fileColumns = await dbAll(`PRAGMA table_info(files);`);
  const fileColNames = new Set(fileColumns.map((c) => c.name));

  if (!fileColNames.has('note_type')) {
    await dbRun(`ALTER TABLE files ADD COLUMN note_type TEXT DEFAULT 'raw';`);
  }
  if (!fileColNames.has('raw_file_id')) {
    await dbRun(`ALTER TABLE files ADD COLUMN raw_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;`);
  }
  if (!fileColNames.has('formal_file_id')) {
    await dbRun(`ALTER TABLE files ADD COLUMN formal_file_id INTEGER REFERENCES files(id) ON DELETE SET NULL;`);
  }
  if (!fileColNames.has('user_id')) {
    await dbRun(`ALTER TABLE files ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';`);
  }
  if (!fileColNames.has('topic_id')) {
    await dbRun(`ALTER TABLE files ADD COLUMN topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL;`);
  }
  if (!fileColNames.has('source_type')) {
    await dbRun(`ALTER TABLE files ADD COLUMN source_type TEXT NOT NULL DEFAULT 'editor';`);
  }

  // Ensure any pre-existing records have user_id = 'default_user'
  await dbRun(`UPDATE files SET user_id = 'default_user' WHERE user_id IS NULL OR user_id = '';`);

  const linkColumns = await dbAll(`PRAGMA table_info(links);`);
  const linkColNames = new Set(linkColumns.map((c) => c.name));
  if (!linkColNames.has('user_id')) {
    await dbRun(`ALTER TABLE links ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';`);
  }
  await dbRun(`UPDATE links SET user_id = 'default_user' WHERE user_id IS NULL OR user_id = '';`);

  // 4. Synthesis Versions & App Settings Tables
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

  await dbRun(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 5. ChattyFi Conversations Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      title TEXT NOT NULL,
      active_topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 6. ChattyFi Messages Table (with Safeguard 5 generation_status vs processing_status separation)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      attachment_ids TEXT NOT NULL DEFAULT '[]',
      topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
      generation_status TEXT NOT NULL DEFAULT 'completed' CHECK(generation_status IN ('streaming', 'completed', 'interrupted', 'failed')),
      processing_status TEXT NOT NULL DEFAULT 'pending' CHECK(processing_status IN ('pending', 'processing', 'completed', 'skipped', 'failed', 'blocked_incomplete')),
      processing_metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Safeguard 5 Database-Level Triggers:
  // Prevent any incomplete, interrupted, or failed message (or empty content) from being marked as 'processing' or 'completed' knowledge.
  await dbRun(`
    CREATE TRIGGER IF NOT EXISTS trg_messages_guard_incomplete_insert
    BEFORE INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.generation_status != 'completed' OR TRIM(NEW.content) = '')
         AND NEW.processing_status IN ('processing', 'completed')
    BEGIN
      SELECT RAISE(ABORT, 'Incomplete, interrupted, or failed messages cannot be processed as complete knowledge');
    END;
  `);

  await dbRun(`
    CREATE TRIGGER IF NOT EXISTS trg_messages_guard_incomplete_update
    BEFORE UPDATE ON messages
    FOR EACH ROW
    WHEN (NEW.generation_status != 'completed' OR TRIM(NEW.content) = '')
         AND NEW.processing_status IN ('processing', 'completed')
    BEGIN
      SELECT RAISE(ABORT, 'Incomplete, interrupted, or failed messages cannot be processed as complete knowledge');
    END;
  `);

  // 7. ChattyFi Conversation <-> Topics Junction Table (with Safeguard 4 Three Confidence Zones)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS conversation_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      first_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
      last_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
      message_count INTEGER NOT NULL DEFAULT 1,
      match_confidence REAL NOT NULL DEFAULT 1.0 CHECK(match_confidence >= 0.0 AND match_confidence <= 1.0),
      match_zone TEXT NOT NULL DEFAULT 'high_confidence' CHECK(match_zone IN ('high_confidence', 'ambiguous', 'low_confidence', 'manual')),
      confirmation_status TEXT NOT NULL DEFAULT 'confirmed' CHECK(confirmation_status IN ('confirmed', 'pending_review', 'rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(conversation_id, topic_id)
    );
  `);

  // 8. ChattyFi Validated Attachments Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
      message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      attachment_type TEXT NOT NULL CHECK(attachment_type IN ('image', 'pdf', 'document')),
      extracted_text TEXT,
      extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK(extraction_status IN ('pending', 'extracted', 'vision_ready', 'unsupported', 'failed')),
      extraction_note TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 9. SQLite FTS5 Virtual Table for Keyword & BM25 Retrieval (Safeguard 3: Verified FTS5, no premature vector DB)
  await dbRun(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vault_fts USING fts5(
      title,
      content,
      keywords,
      file_id UNINDEXED,
      topic_id UNINDEXED,
      user_id UNINDEXED,
      tokenize = 'porter unicode61'
    );
  `);

  // 10. Database Indexes for Ownership Checks & Query Performance (Safeguard 6)
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_files_topic_id ON files(topic_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_links_source_file_id ON links(source_file_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_links_target_file_id ON links(target_file_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at ASC);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_topics_user_norm ON topics(user_id, normalized_name);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_conv_topics_conv ON conversation_topics(conversation_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_conv_topics_topic ON conversation_topics(topic_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_conv_topics_user ON conversation_topics(user_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_attachments_conv ON attachments(conversation_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_attachments_msg ON attachments(message_id);`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_attachments_user ON attachments(user_id);`);

  // Backfill FTS5 index with existing files
  await rebuildVaultFts();

  console.log('Database initialized successfully at:', dbPath);
}
