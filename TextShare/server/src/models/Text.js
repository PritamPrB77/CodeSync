const mongoose = require('mongoose');

const TextSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    passwordHash: { type: String },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }
  },
  { versionKey: false }
);

// TTL on expiresAt if set. expireAfterSeconds: 0 tells Mongo to expire at the specified time
TextSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Text', TextSchema);
