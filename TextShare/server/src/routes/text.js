const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Text = require('../models/Text');
const FileMeta = require('../models/File');
const { generateUniqueCode, getExpiresAt } = require('../utils/helpers');

// POST /api/text -> { code }
router.post('/', async (req, res) => {
  try {
    const { text, password, expirationDays } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Generate unique code across texts and files
    const code = await generateUniqueCode([Text, FileMeta]);
    if (!code) {
      return res.status(500).json({ error: 'Failed to generate unique code' });
    }

    // Hash password if provided
    let passwordHash = undefined;
    if (password && typeof password === 'string' && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const expiresAt = getExpiresAt(Number.isFinite(expirationDays) ? expirationDays : undefined);

    const doc = await Text.create({ code, text, passwordHash, expiresAt });

    return res.status(201).json({ code: doc.code });
  } catch (err) {
    console.error('POST /api/text error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/text/:code -> { text }
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const suppliedPassword = req.query.password || req.headers['x-paste-password'];

    const doc = await Text.findOne({ code });
    if (!doc) {
      return res.status(404).json({ error: 'Code not found' });
    }

    if (doc.passwordHash) {
      if (!suppliedPassword || typeof suppliedPassword !== 'string') {
        return res.status(401).json({ error: 'Password required' });
      }
      const ok = await bcrypt.compare(suppliedPassword, doc.passwordHash);
      if (!ok) {
        return res.status(403).json({ error: 'Invalid password' });
      }
    }

    // increment views (non-critical)
    try {
      await Text.updateOne({ _id: doc._id }, { $inc: { views: 1 } });
    } catch (_) {}

    return res.json({ text: doc.text });
  } catch (err) {
    console.error('GET /api/text/:code error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
