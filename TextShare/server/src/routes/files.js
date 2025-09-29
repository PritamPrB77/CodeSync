const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const FileMeta = require('../models/File');
const Text = require('../models/Text');
const { generateUniqueCode, getExpiresAt, isImageMime } = require('../utils/helpers');

const STORAGE_DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10);

// Multer configuration
let upload;
if (STORAGE_DRIVER === 'local') {
  const destination = path.isAbsolute(UPLOADS_DIR) ? UPLOADS_DIR : path.join(process.cwd(), UPLOADS_DIR);
  const storage = multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
      const unique = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      cb(null, `${base || 'file'}_${unique}${ext}`);
    }
  });
  upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 } });
} else {
  // gridfs: store in memory then stream to GridFS
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 } });
}

// POST /api/upload -> { code }
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { password, expirationDays } = req.body || {};

    // Generate unique code across texts and files
    const code = await generateUniqueCode([Text, FileMeta]);
    if (!code) return res.status(500).json({ error: 'Failed to generate unique code' });

    let passwordHash = undefined;
    if (password && typeof password === 'string' && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const expiresAt = getExpiresAt(Number.isFinite(parseInt(expirationDays, 10)) ? parseInt(expirationDays, 10) : undefined);

    let storage = STORAGE_DRIVER;
    let localPath = null;
    let gridfsId = null;

    if (STORAGE_DRIVER === 'local') {
      // file stored by multer on disk
      localPath = path.relative(process.cwd(), req.file.path);
    } else {
      // gridfs: write buffer to GridFS
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const uploadStream = bucket.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });
      uploadStream.end(req.file.buffer);
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      gridfsId = uploadStream.id;
      storage = 'gridfs';
    }

    const doc = await FileMeta.create({
      code,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storage,
      localPath,
      gridfsId,
      passwordHash,
      expiresAt
    });

    return res.status(201).json({ code: doc.code, filename: doc.originalName, mimeType: doc.mimeType, size: doc.size });
  } catch (err) {
    console.error('POST /api/upload error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/file/:code -> metadata
router.get('/file/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const suppliedPassword = req.query.password || req.headers['x-paste-password'];

    const doc = await FileMeta.findOne({ code });
    if (!doc) return res.status(404).json({ error: 'Code not found' });

    if (doc.passwordHash) {
      if (!suppliedPassword || typeof suppliedPassword !== 'string') {
        return res.status(401).json({ error: 'Password required' });
      }
      const ok = await bcrypt.compare(suppliedPassword, doc.passwordHash);
      if (!ok) return res.status(403).json({ error: 'Invalid password' });
    }

    try { await FileMeta.updateOne({ _id: doc._id }, { $inc: { views: 1 } }); } catch (_) {}

    return res.json({
      code: doc.code,
      filename: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      isImage: isImageMime(doc.mimeType)
    });
  } catch (err) {
    console.error('GET /api/file/:code error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/file/:code/download -> stream
router.get('/file/:code/download', async (req, res) => {
  try {
    const { code } = req.params;
    const suppliedPassword = req.query.password || req.headers['x-paste-password'];
    const inline = req.query.inline === '1' || req.query.inline === 'true';

    const doc = await FileMeta.findOne({ code });
    if (!doc) return res.status(404).json({ error: 'Code not found' });

    if (doc.passwordHash) {
      if (!suppliedPassword || typeof suppliedPassword !== 'string') {
        return res.status(401).json({ error: 'Password required' });
      }
      const ok = await bcrypt.compare(suppliedPassword, doc.passwordHash);
      if (!ok) return res.status(403).json({ error: 'Invalid password' });
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    const disposition = inline || isImageMime(doc.mimeType) ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`);

    if (doc.storage === 'local' && doc.localPath) {
      const full = path.isAbsolute(doc.localPath) ? doc.localPath : path.join(process.cwd(), doc.localPath);
      if (!fs.existsSync(full)) return res.status(410).json({ error: 'File no longer available' });
      fs.createReadStream(full).pipe(res);
    } else if (doc.storage === 'gridfs' && doc.gridfsId) {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
      const dstream = bucket.openDownloadStream(doc.gridfsId);
      dstream.on('error', () => res.status(410).end());
      dstream.pipe(res);
    } else {
      return res.status(410).json({ error: 'File no longer available' });
    }
  } catch (err) {
    console.error('GET /api/file/:code/download error', err);
    if (!res.headersSent) return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
