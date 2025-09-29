const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storage: { type: String, enum: ['local', 'gridfs'], required: true },
    localPath: { type: String },
    gridfsId: { type: mongoose.Schema.Types.ObjectId },
    passwordHash: { type: String },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null }
  },
  { versionKey: false }
);

module.exports = mongoose.model('File', FileSchema);
