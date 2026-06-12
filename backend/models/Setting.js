const mongoose = require('mongoose');

/**
 * SETTING
 * Penyimpanan key-value sederhana untuk konfigurasi runtime.
 * Dipakai antara lain untuk menyimpan hash password login app
 * (key: 'app_password_hash') agar password bisa diganti dari web.
 */
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Setting', settingSchema);
