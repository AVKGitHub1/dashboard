import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { config } from '../config.js';

const iconsDir = path.join(config.uploadsDir, 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// SVG deliberately excluded: it's an XML format that can embed <script>, and a browser
// executes that script if the file is ever opened directly as a top-level document
// (unlike an <img> tag, which sandboxes it) — a stored-XSS vector on our own origin
// since we serve uploads from the same domain as the app.
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, iconsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ALLOWED_EXT.has(ext) ? ext : ''}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return cb(new Error('Unsupported icon file type'));
  cb(null, true);
}

export const uploadIcon = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
