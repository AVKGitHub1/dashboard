import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), '../data');

export const config = {
  // 7070 is a deliberately distinct default, picked to avoid the common 8080/3000/8000/5000
  // collisions self-hosted stacks tend to run into.
  port: parseInt(process.env.PORT || '7070', 10),
  dataDir: DATA_DIR,
  dbPath: path.join(DATA_DIR, 'dashboard.db'),
  secretKeyPath: path.join(DATA_DIR, 'secret.key'),
  uploadsDir: path.join(DATA_DIR, 'uploads'),
  sessionSecret: process.env.SESSION_SECRET || null, // generated + persisted if absent, see bootstrap
  appSecret: process.env.APP_SECRET || null, // optional override for api-key encryption key
  // 'auto' -> secure cookie only if request looks like https (X-Forwarded-Proto), else honor explicit true/false
  cookieSecure: (process.env.COOKIE_SECURE || 'auto').toLowerCase(),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicDir: path.resolve(process.cwd(), 'public'),
};
