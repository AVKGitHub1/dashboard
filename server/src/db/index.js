import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

fs.mkdirSync(config.dataDir, { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function applySchema() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schemaSql);
}

// One-off upgrades for databases created before a schema change (CREATE TABLE IF NOT
// EXISTS never alters a table that already exists). Each step checks for itself whether
// it still needs to run, so this is safe on every boot.
function migrate() {
  const todoColumns = db.prepare('PRAGMA table_info(todo_items)').all().map((c) => c.name);
  if (!todoColumns.includes('status')) {
    // Checklist items went from a done/not-done flag to three stages: checked items
    // become 'done', unchecked ones 'todo'.
    db.transaction(() => {
      db.exec(
        "ALTER TABLE todo_items ADD COLUMN status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done'))"
      );
      db.exec("UPDATE todo_items SET status = CASE WHEN done THEN 'done' ELSE 'todo' END");
      db.exec('ALTER TABLE todo_items DROP COLUMN done');
    })();
  }
}

// Applied immediately on module load (idempotent CREATE TABLE IF NOT EXISTS), not just
// when bootstrap explicitly calls it — several modules prepare statements at import time
// (e.g. sessionStore.js, apiKeys.service.js), and ES module evaluation order means those
// imports can run before index.js's own top-level bootstrap call does.
applySchema();
migrate();
