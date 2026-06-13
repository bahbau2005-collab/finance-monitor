const mongoose = require('mongoose');

/**
 * BUDGET — batas pengeluaran (anggaran). Dokumen tunggal (singleton).
 * Nilai 0 = tidak ada batas untuk periode tsb.
 */
const budgetSchema = new mongoose.Schema({
  daily: { type: Number, default: 0, min: 0 },
  weekly: { type: Number, default: 0, min: 0 },
  monthly: { type: Number, default: 0, min: 0 },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Budget', budgetSchema);
