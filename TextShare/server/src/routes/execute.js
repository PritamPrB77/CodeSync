const express = require('express');
const router = express.Router();
const { getSession, updateSession } = require('../services/sessionStore');
const { executeJudge0 } = require('../services/judge0');

// POST /api/execute -> { output }
// body: { language, code, stdin, sessionId }
router.post('/execute', async (req, res) => {
  try {
    const { language = 'javascript', code = '', stdin = '', sessionId } = req.body || {};
    const provider = (process.env.EXECUTION_PROVIDER || 'judge0').toLowerCase();

    let result;
    if (provider === 'judge0') {
      result = await executeJudge0({ language, source: code, stdin });
    } else {
      return res.status(500).json({ error: 'Unsupported execution provider' });
    }

    // Broadcast to session participants if sessionId provided
    if (sessionId) {
      const io = req.app.get('io');
      if (io) io.to(sessionId).emit('execution-result', { sessionId, language, result });
    }

    return res.json({ language, result });
  } catch (e) {
    console.error('execute error', e);
    return res.status(500).json({ error: e.message || 'Execution failed' });
  }
});

module.exports = router;