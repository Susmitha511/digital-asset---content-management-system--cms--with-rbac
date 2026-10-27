import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed extensions whitelist
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
  '.pdf', '.txt', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.json', '.md', '.csv',
  '.mp4', '.webm', '.mp3', '.wav', '.ogg'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Sanitize extension
    const ext = path.extname(file.originalname).toLowerCase();
    const safeUUID = crypto.randomUUID();
    // Safe stored filename prevents path traversal and collisions
    const storedName = `${safeUUID}${ext}`;
    cb(null, storedName);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File extension '${ext}' is not permitted by organizational security policy.`));
    }
    cb(null, true);
  }
});
