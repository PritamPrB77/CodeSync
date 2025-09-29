const { customAlphabet } = require('nanoid');

const CODE_LENGTH = 6;
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nano = customAlphabet(alphabet, CODE_LENGTH);

async function generateUniqueCode(models, attempts = 7) {
  for (let i = 0; i < attempts; i++) {
    const code = nano();
    const checks = await Promise.all(models.map(m => m.exists({ code })));
    if (!checks.some(Boolean)) return code;
  }
  return null;
}

function getExpiresAt(expirationDays) {
  const days = Number.isFinite(expirationDays)
    ? expirationDays
    : (process.env.DEFAULT_TTL_DAYS ? parseInt(process.env.DEFAULT_TTL_DAYS, 10) : 0);
  if (!days || days <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function isImageMime(mime) {
  return typeof mime === 'string' && mime.startsWith('image/');
}

module.exports = { generateUniqueCode, getExpiresAt, isImageMime };
