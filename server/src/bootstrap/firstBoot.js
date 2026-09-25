import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { applySchema, db } from '../db/index.js';
import { ensureEncryptionKey } from '../services/crypto.service.js';
import { generatePassword } from '../utils/password.js';
import { config } from '../config.js';

const SESSION_SECRET_PATH = `${config.dataDir}/session.secret`;

function ensureSessionSecret() {
  if (config.sessionSecret) return config.sessionSecret;
  if (fs.existsSync(SESSION_SECRET_PATH)) {
    return fs.readFileSync(SESSION_SECRET_PATH, 'utf8').trim();
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SESSION_SECRET_PATH, secret, { mode: 0o600 });
  return secret;
}

function ensureFirstUser() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count > 0) return;

  const username = 'admin';
  const password = generatePassword(20);
  const passwordHash = bcrypt.hashSync(password, 12);

  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
    username,
    passwordHash
  );

  const line = '='.repeat(60);
  console.log(`\n${line}`);
  console.log(' Dashboard — first-run admin credentials (shown only once)');
  console.log(` Username: ${username}`);
  console.log(` Password: ${password}`);
  console.log(' Store this somewhere safe. It will not be shown again.');
  console.log(`${line}\n`);
}

/**
 * Runs once at the top of every boot, before the HTTP server starts listening.
 * Idempotent: safe to run on every restart.
 */
export function runFirstBoot() {
  applySchema();
  ensureEncryptionKey();
  ensureFirstUser();
  return { sessionSecret: ensureSessionSecret() };
}
