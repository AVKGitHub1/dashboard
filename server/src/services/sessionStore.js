import session from 'express-session';
import { db } from '../db/index.js';

const upsertStmt = db.prepare(`
  INSERT INTO sessions (sid, session_json, expires_at) VALUES (?, ?, ?)
  ON CONFLICT(sid) DO UPDATE SET session_json = excluded.session_json, expires_at = excluded.expires_at
`);
const getStmt = db.prepare('SELECT session_json, expires_at FROM sessions WHERE sid = ?');
const destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
const touchStmt = db.prepare('UPDATE sessions SET expires_at = ? WHERE sid = ?');
const sweepStmt = db.prepare('DELETE FROM sessions WHERE expires_at < ?');

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function expiresAtFor(sessionData) {
  const maxAge = sessionData?.cookie?.originalMaxAge;
  return Date.now() + (typeof maxAge === 'number' ? maxAge : DEFAULT_TTL_MS);
}

/**
 * Minimal express-session Store backed by the same better-sqlite3 connection
 * the rest of the app uses, so sessions survive container restarts without
 * pulling in a second SQLite driver.
 */
export class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    // Periodic sweep of expired rows.
    this._sweepInterval = setInterval(() => {
      sweepStmt.run(Date.now());
    }, 1000 * 60 * 60).unref();
  }

  get(sid, callback) {
    try {
      const row = getStmt.get(sid);
      if (!row || row.expires_at < Date.now()) return callback(null, null);
      callback(null, JSON.parse(row.session_json));
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sessionData, callback) {
    try {
      upsertStmt.run(sid, JSON.stringify(sessionData), expiresAtFor(sessionData));
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid, callback) {
    try {
      destroyStmt.run(sid);
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  touch(sid, sessionData, callback) {
    try {
      touchStmt.run(expiresAtFor(sessionData), sid);
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }
}
