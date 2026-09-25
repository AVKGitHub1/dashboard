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

// Applied immediately on module load (idempotent CREATE TABLE IF NOT EXISTS), not just
// when bootstrap explicitly calls it — several modules prepare statements at import time
// (e.g. sessionStore.js, apiKeys.service.js), and ES module evaluation order means those
// imports can run before index.js's own top-level bootstrap call does.
applySchema();
