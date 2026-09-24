const mongoose = require('mongoose');

/**
 * RATE LIMIT
 * Penghitung percobaan (login, kode reset, kirim email) yang disimpan di DB,
 * karena di serverless (Vercel) memori tidak dibagi antar instance.
 * Dokumen otomatis dihapus MongoDB setelah `expiresAt` lewat (TTL index).
 */
const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  windowStart: { type: Date, default: Date.now },
  lockedUntil: { type: Date, default: null },
  expiresAt: { type: Date, expires: 0 },
});

module.exports = mongoose.model('RateLimit', rateLimitSchema);
