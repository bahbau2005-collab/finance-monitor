const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const Setting = require('../models/Setting');

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

module.exports = router;
