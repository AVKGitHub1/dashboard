import { db } from '../db/index.js';
import { decrypt, encrypt } from './crypto.service.js';

const PROVIDERS = ['openweathermap', 'finnhub'];

const getStmt = db.prepare('SELECT ciphertext, iv, auth_tag FROM api_keys WHERE provider = ?');
const upsertStmt = db.prepare(`
  INSERT INTO api_keys (provider, ciphertext, iv, auth_tag, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
  ON CONFLICT(provider) DO UPDATE SET ciphertext = excluded.ciphertext, iv = excluded.iv, auth_tag = excluded.auth_tag, updated_at = datetime('now')
`);
const deleteStmt = db.prepare('DELETE FROM api_keys WHERE provider = ?');

export function isKnownProvider(provider) {
  return PROVIDERS.includes(provider);
}

export function getConfiguredStatus() {
  const status = {};
  for (const provider of PROVIDERS) {
    status[provider] = Boolean(getStmt.get(provider));
  }
  return status;
}

export function getApiKey(provider) {
  const row = getStmt.get(provider);
  if (!row) return null;
  return decrypt({ ciphertext: row.ciphertext, iv: row.iv, authTag: row.auth_tag });
}

export function setApiKey(provider, plaintextKey) {
  const { ciphertext, iv, authTag } = encrypt(plaintextKey);
  upsertStmt.run(provider, ciphertext, iv, authTag);
}

export function deleteApiKey(provider) {
  deleteStmt.run(provider);
}
