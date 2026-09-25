#!/usr/bin/env node
// Lockout recovery: the generated admin password is shown exactly once at first boot
// and never again. If it's lost, run this from the host to set a new one, e.g.:
//   docker exec <container> node src/scripts/resetPassword.js admin <newPassword>
import bcrypt from 'bcrypt';
import { db } from '../db/index.js';

const [username, newPassword] = process.argv.slice(2);

if (!username || !newPassword) {
  console.error('Usage: node src/scripts/resetPassword.js <username> <newPassword>');
  process.exit(1);
}

const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (!user) {
  console.error(`No such user: ${username}`);
  process.exit(1);
}

const hash = bcrypt.hashSync(newPassword, 12);
db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
console.log(`Password updated for "${username}".`);
