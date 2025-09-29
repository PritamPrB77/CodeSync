const { getSession, updateSession } = require('../services/sessionStore');

function setupCollab(io) {
  io.on('connection', (socket) => {
    // Join a session room
    socket.on('join-session', ({ sessionId }) => {
      if (!sessionId) return;
      const s = getSession(sessionId);
      if (!s) return;
      socket.join(sessionId);
      socket.emit('session-init', { language: s.language, code: s.code });
      socket.to(sessionId).emit('user-joined', { id: socket.id });
    });

    // Code changes
    socket.on('code-change', ({ sessionId, code }) => {
      if (!sessionId) return;
      updateSession(sessionId, { code });
      socket.to(sessionId).emit('code-change', { code });
    });

    // Cursor changes
    socket.on('cursor-change', ({ sessionId, cursor, color }) => {
      if (!sessionId) return;
      socket.to(sessionId).emit('cursor-change', { userId: socket.id, cursor, color });
    });

    socket.on('disconnect', () => {
      // could emit user-left with rooms if needed
    });
  });
}

module.exports = { setupCollab };