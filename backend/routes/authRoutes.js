const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const Setting = require('../models/Setting');
const { sendEmail } = require('../lib/email');
const { clientIp, consume, reset, formatWait } = require('../lib/rateLimit');

const router = express.Router();

// Batas percobaan (anti brute-force / spam)
const MIN = 60 * 1000;
const LOGIN_PER_IP = { max: 5, windowMs: 15 * MIN, lockMs: 15 * MIN };
const LOGIN_GLOBAL = { max: 30, windowMs: 15 * MIN, lockMs: 15 * MIN }; // kalau penyerang ganti-ganti IP
const RESET_CODE_TRIES = { max: 5, windowMs: 10 * MIN, lockMs: 10 * MIN }; // lewat → kode hangus
const FORGOT_COOLDOWN = { max: 1, windowMs: 1 * MIN, lockMs: 1 * MIN };
const FORGOT_HOURLY = { max: 5, windowMs: 60 * MIN, lockMs: 60 * MIN };

const tooMany = (res, message) => res.status(429).json({ success: false, message });

// Password awal dari environment variable. Dipakai HANYA jika belum pernah
// diganti lewat web (yaitu belum ada hash tersimpan di database).
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin123';
const PASSWORD_KEY = 'app_password_hash';

/**
 * Verifikasi password terhadap sumber kebenaran:
 * - Jika ada hash tersimpan di DB → bandingkan dengan bcrypt.
 * - Jika belum ada → bandingkan dengan APP_PASSWORD (env) sebagai password awal.
 */
async function verifyPassword(password) {
  const stored = await Setting.findOne({ key: PASSWORD_KEY });
  if (stored && stored.value) {
    return bcrypt.compare(password, stored.value);
  }
  return password === APP_PASSWORD;
}

/**
 * POST /api/auth/login
 * Body: { password } -> token JWT bila benar.
 */
router.post('/login', async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password wajib diisi' });
  }

  try {
    const ipKey = `login:ip:${clientIp(req)}`;
    const perIp = await consume(ipKey, LOGIN_PER_IP);
    if (!perIp.allowed) {
      return tooMany(res, `Terlalu banyak percobaan login. Coba lagi dalam ${formatWait(perIp.retryAfter)}.`);
    }
    const global = await consume('login:global', LOGIN_GLOBAL);
    if (!global.allowed) {
      return tooMany(res, `Login dikunci sementara karena terlalu banyak percobaan. Coba lagi dalam ${formatWait(global.retryAfter)}.`);
    }

    const ok = await verifyPassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }
    await reset(ipKey);
    const token = jwt.sign({ role: 'owner' }, JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ success: true, message: 'Login berhasil', token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saat login', error: err.message });
  }
});

/**
 * GET /api/auth/verify
 * Cek apakah token masih valid.
 */
router.get('/verify', requireAuth, (req, res) => {
  res.status(200).json({ success: true, message: 'Token valid' });
});

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword } (perlu login/token).
 * Verifikasi password saat ini, lalu simpan hash password baru ke DB.
 */
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'Password baru harus berbeda dari password lama' });
  }

  try {
    const ok = await verifyPassword(currentPassword);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Password saat ini salah' });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await Setting.findOneAndUpdate(
      { key: PASSWORD_KEY },
      { value: hash, updatedAt: Date.now() },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Password berhasil diganti' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error saat mengganti password', error: err.message });
  }
});

/**
 * POST /api/auth/forgot
 * Kirim kode reset 6 digit ke email pemulihan (RECOVERY_EMAIL).
 */
router.post('/forgot', async (req, res) => {
  try {
    const cooldown = await consume('forgot:cooldown', FORGOT_COOLDOWN);
    if (!cooldown.allowed) {
      return tooMany(res, `Tunggu ${formatWait(cooldown.retryAfter)} sebelum minta kode lagi.`);
    }
    const hourly = await consume('forgot:hourly', FORGOT_HOURLY);
    if (!hourly.allowed) {
      return tooMany(res, `Terlalu sering minta kode. Coba lagi dalam ${formatWait(hourly.retryAfter)}.`);
    }

    const to = process.env.RECOVERY_EMAIL || 'bahbau2005@gmail.com';
    const code = String(crypto.randomInt(100000, 1000000)); // 6 digit
    const hash = await bcrypt.hash(code, 10);
    const exp = Date.now() + 10 * 60 * 1000; // 10 menit
    await Setting.findOneAndUpdate({ key: 'reset_code' }, { value: hash, updatedAt: Date.now() }, { upsert: true });
    await Setting.findOneAndUpdate({ key: 'reset_code_exp' }, { value: String(exp), updatedAt: Date.now() }, { upsert: true });
    await reset('reset:code'); // kode baru → jatah tebakan baru

    await sendEmail({
      to,
      subject: 'Kode Reset Password — Finance Monitor',
      html: `<div style="font-family:sans-serif">
        <p>Halo,</p>
        <p>Kode untuk reset password Finance Monitor kamu:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#9a7636">${code}</p>
        <p>Berlaku 10 menit. Abaikan email ini jika kamu tidak meminta reset.</p>
      </div>`,
    });

    res.status(200).json({ success: true, message: 'Kode reset sudah dikirim ke email kamu.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Gagal mengirim kode reset' });
  }
});

/**
 * POST /api/auth/reset
 * Body: { code, newPassword } — verifikasi kode lalu set password baru.
 */
router.post('/reset', async (req, res) => {
  try {
    const { code, newPassword } = req.body || {};
    if (!code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Kode dan password baru wajib diisi' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    }

    const stored = await Setting.findOne({ key: 'reset_code' });
    const expDoc = await Setting.findOne({ key: 'reset_code_exp' });
    if (!stored || !expDoc) {
      return res.status(400).json({ success: false, message: 'Belum ada permintaan reset. Kirim kode dulu.' });
    }
    if (Date.now() > Number(expDoc.value)) {
      return res.status(400).json({ success: false, message: 'Kode sudah kedaluwarsa. Kirim ulang kode.' });
    }

    // Maks 5 tebakan per kode; lewat dari itu kode dihanguskan
    const attempt = await consume('reset:code', RESET_CODE_TRIES);
    if (!attempt.allowed) {
      await Setting.deleteOne({ key: 'reset_code' });
      await Setting.deleteOne({ key: 'reset_code_exp' });
      return tooMany(res, 'Terlalu banyak kode salah. Kode sudah hangus, kirim ulang kode baru.');
    }

    const ok = await bcrypt.compare(String(code), stored.value);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Kode salah.' });
    }
    await reset('reset:code');

    const hash = await bcrypt.hash(String(newPassword), 10);
    await Setting.findOneAndUpdate({ key: PASSWORD_KEY }, { value: hash, updatedAt: Date.now() }, { upsert: true });
    await Setting.deleteOne({ key: 'reset_code' });
    await Setting.deleteOne({ key: 'reset_code_exp' });

    res.status(200).json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal reset password', error: err.message });
  }
});

module.exports = router;
