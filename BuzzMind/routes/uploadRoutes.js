const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\-]/g, '');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
});

const DOC_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

function fileKind(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('word')) return 'word';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) {
    return 'ppt';
  }
  if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'excel';
  if (mimetype === 'text/plain') return 'text';
  return 'file';
}

const fileUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || DOC_MIME.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Unsupported file type. Use an image, PDF, Word, PPT or text file.'));
  },
});

// Image-only upload, used for quiz question images (professor).
router.post(
  '/',
  requireAuth,
  requireRole('professor'),
  imageUpload.single('file'),
  (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      res.status(201).json({ url: `/uploads/${req.file.filename}` });
    } catch (err) {
      next(err);
    }
  },
);

// General document/image upload for assignment attachments and submissions.
router.post(
  '/file',
  requireAuth,
  fileUpload.single('file'),
  (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      res.status(201).json({
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname,
        kind: fileKind(req.file.mimetype),
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
