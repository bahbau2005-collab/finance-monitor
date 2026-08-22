const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const Setting = require('../models/Setting');
const { sendEmail } = require('../lib/email');

const router = express.Router();

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
    const ok = await verifyPassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }
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
    const to = process.env.RECOVERY_EMAIL || 'bahbau2005@gmail.com';
    const code = String(crypto.randomInt(100000, 1000000)); // 6 digit
    const hash = await bcrypt.hash(code, 10);
    const exp = Date.now() + 10 * 60 * 1000; // 10 menit
    await Setting.findOneAndUpdate({ key: 'reset_code' }, { value: hash, updatedAt: Date.now() }, { upsert: true });
    await Setting.findOneAndUpdate({ key: 'reset_code_exp' }, { value: String(exp), updatedAt: Date.now() }, { upsert: true });

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
    const ok = await bcrypt.compare(String(code), stored.value);
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Kode salah.' });
    }

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
