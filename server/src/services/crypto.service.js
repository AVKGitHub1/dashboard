import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from '../config.js';

let key = null;

/**
 * Loads (or generates + persists) the AES-256-GCM key used to encrypt stored
 * third-party API keys at rest. If APP_SECRET is set, it's derived into a key
 * instead of touching disk (useful for reproducible deployments / secret managers).
 * Losing secret.key (or changing APP_SECRET) invalidates previously stored API keys.
 */
export function ensureEncryptionKey() {
  if (config.appSecret) {
    key = crypto.createHash('sha256').update(config.appSecret).digest();
    return;
  }
  if (fs.existsSync(config.secretKeyPath)) {
    key = fs.readFileSync(config.secretKeyPath);
    return;
  }
  key = crypto.randomBytes(32);
  fs.writeFileSync(config.secretKeyPath, key, { mode: 0o600 });
}

export function encrypt(plaintext) {
  if (!key) throw new Error('Encryption key not initialized');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

export function decrypt({ ciphertext, iv, authTag }) {
  if (!key) throw new Error('Encryption key not initialized');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
