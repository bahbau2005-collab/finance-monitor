const RateLimit = require('../models/RateLimit');

/**
 * IP klien. Di Vercel, x-real-ip / x-forwarded-for diisi oleh edge Vercel
 * (bukan dari klien), jadi aman dipakai sebagai kunci.
 */
function clientIp(req) {
  const real = req.headers['x-real-ip'];
  if (real) return String(real).trim();
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || 'unknown';
}

/**
 * Pakai 1 jatah percobaan untuk `key`.
 * Penghitung dinaikkan SEBELUM aksi dijalankan (atomik via $inc), sehingga
 * ratusan request paralel tetap tidak bisa melewati batas.
 *
 * Aturan: maksimal `max` percobaan per `windowMs`. Lewat dari itu → dikunci `lockMs`.
 * Return: { allowed: boolean, retryAfter: detik }.
 */
async function consume(key, { max, windowMs, lockMs }) {
  const now = new Date();

  const existing = await RateLimit.findOne({ key }).lean();
  if (existing?.lockedUntil && existing.lockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((existing.lockedUntil - now) / 1000) };
  }

  // Window lama sudah lewat (dan tidak sedang dikunci) → mulai hitungan baru
  await RateLimit.updateOne(
    {
      key,
      windowStart: { $lt: new Date(now.getTime() - windowMs) },
      $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }],
    },
    { $set: { count: 0, windowStart: now, lockedUntil: null } }
  );

  const update = {
    $inc: { count: 1 },
    $setOnInsert: { windowStart: now },
    $set: { expiresAt: new Date(now.getTime() + windowMs + lockMs) },
  };
  let doc;
  try {
    doc = await RateLimit.findOneAndUpdate({ key }, update, { upsert: true, new: true });
  } catch (err) {
    // Dua upsert paralel untuk key baru bisa bentrok di unique index → ulangi sekali
    if (err.code !== 11000) throw err;
    doc = await RateLimit.findOneAndUpdate({ key }, update, { new: true });
  }

  if (doc.count > max) {
    const lockedUntil = new Date(now.getTime() + lockMs);
    await RateLimit.updateOne(
      { key, $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }] },
      { $set: { lockedUntil } }
    );
    return { allowed: false, retryAfter: Math.ceil(lockMs / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

/** Hapus penghitung (misal setelah login berhasil). */
async function reset(key) {
  await RateLimit.deleteOne({ key });
}

/** "90 detik" / "15 menit" untuk pesan ke user. */
function formatWait(seconds) {
  if (seconds < 60) return `${seconds} detik`;
  return `${Math.ceil(seconds / 60)} menit`;
}

module.exports = { clientIp, consume, reset, formatWait };
