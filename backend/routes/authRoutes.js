const express = require('express');
const jwt = require('jsonwebtoken');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Password app disimpan di environment variable (TIDAK di dalam kode).
// Default hanya untuk pengembangan lokal — WAJIB diganti saat hosting.
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin123';

/**
 * POST /api/auth/login
 * Body: { password }
 * Mengembalikan token JWT bila password benar.
 */
router.post('/login', (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password wajib diisi' });
  }

  if (password !== APP_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Password salah' });
  }

  // Token berlaku 30 hari supaya tidak perlu login terus-menerus.
  const token = jwt.sign({ role: 'owner' }, JWT_SECRET, { expiresIn: '30d' });
  res.status(200).json({ success: true, message: 'Login berhasil', token });
});

/**
 * GET /api/auth/verify
 * Cek apakah token masih valid (dipakai frontend saat buka app).
 */
router.get('/verify', requireAuth, (req, res) => {
  res.status(200).json({ success: true, message: 'Token valid' });
});

module.exports = router;
