const mongoose = require('mongoose');

/**
 * TARGET
 * Target akumulasi kekayaan. Progress dihitung otomatis dari data app
 * (kind 'asset' -> holding di Aset, kind 'cash' -> total saldo Cash),
 * atau manual (kind 'manual').
 *
 * targetAmount disimpan dalam SATUAN DASAR:
 * - gold  : gram
 * - saham : lembar
 * - btc/crypto/barang : koin/unit
 * - cash/manual : Rupiah
 */
const targetSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Nama target harus diisi'], trim: true, maxlength: 100 },
  kind: { type: String, enum: ['asset', 'cash', 'manual'], required: true },
  assetType: { type: String, enum: ['btc', 'crypto', 'gold', 'saham', 'barang', null], default: null },
  targetAmount: { type: Number, required: [true, 'Jumlah target harus diisi'], min: [0, 'Target harus positif'] },
  currentManual: { type: Number, default: 0 }, // hanya untuk kind 'manual'
  deadline: { type: Date, default: null },
  note: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

module.exports = mongoose.model('Target', targetSchema);
