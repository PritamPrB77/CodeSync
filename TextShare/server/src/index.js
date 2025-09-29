require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { setupCollab } = require('./realtime/collab');

const app = express();

// Config
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/text_sharer';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const STORAGE_DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';

// CORS
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));

// Body parser
app.use(express.json({ limit: '1mb' }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/text', require('./routes/text'));
app.use('/api', require('./routes/files'));
app.use('/api', require('./routes/session'));
app.use('/api', require('./routes/execute'));

// Cleanup job for expired files (runs hourly)
function registerCleanupJob() {
  const FileMeta = require('./models/File');
  setInterval(async () => {
    try {
      const now = new Date();
      const expired = await FileMeta.find({ expiresAt: { $ne: null, $lte: now } }).limit(100);
      if (!expired.length) return;
      const bucket = (STORAGE_DRIVER === 'gridfs' && mongoose.connection.db)
        ? new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' })
        : null;

      for (const doc of expired) {
        try {
          if (doc.storage === 'local' && doc.localPath) {
            const full = path.isAbsolute(doc.localPath) ? doc.localPath : path.join(process.cwd(), doc.localPath);
            fs.existsSync(full) && fs.unlinkSync(full);
          } else if (doc.storage === 'gridfs' && doc.gridfsId && bucket) {
            await bucket.delete(doc.gridfsId);
          }
        } catch (e) {
          // ignore individual errors
        }
        try {
          await FileMeta.deleteOne({ _id: doc._id });
        } catch (e) {}
      }
    } catch (e) {
      // ignore
    }
  }, 60 * 60 * 1000);
}

// Mongo connection and server start
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Ensure uploads dir exists for local storage
    if (STORAGE_DRIVER === 'local') {
      const dir = path.isAbsolute(UPLOADS_DIR) ? UPLOADS_DIR : path.join(process.cwd(), UPLOADS_DIR);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    registerCleanupJob();

    // Create HTTP server + Socket.IO
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }
    });
    app.set('io', io);
    setupCollab(io);

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
