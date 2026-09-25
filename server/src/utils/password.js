import crypto from 'node:crypto';

// Alphabet avoids visually ambiguous characters (0/O, 1/l/I) to reduce transcription errors
// when a human reads the generated password out of docker logs.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%^&*';

export function generatePassword(length = 20) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
