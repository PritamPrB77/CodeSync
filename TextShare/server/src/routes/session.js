const express = require('express');
const router = express.Router();
const { createSession, getSession } = require('../services/sessionStore');

// POST /api/session -> { id }
router.post('/session', (req, res) => {
  try {
    const { language, code } = req.body || {};
    const s = createSession({ language, code });
    return res.status(201).json({ id: s.id });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/session/:id -> { id, language, code }
router.get('/session/:id', (req, res) => {
  const s = getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  return res.json({ id: s.id, language: s.language, code: s.code });
});

module.exports = router;