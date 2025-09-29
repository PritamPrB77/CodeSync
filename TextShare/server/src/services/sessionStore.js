// Simple in-memory session store
// Consider using MongoDB for persistence if desired.
const sessions = new Map();

function createSession({ language = 'javascript', code = '' } = {}) {
  const id = Math.random().toString(36).slice(2, 8);
  const session = { id, language, code, createdAt: new Date() };
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id) || null;
}

function updateSession(id, patch) {
  const s = sessions.get(id);
  if (!s) return null;
  Object.assign(s, patch);
  return s;
}

module.exports = { createSession, getSession, updateSession };