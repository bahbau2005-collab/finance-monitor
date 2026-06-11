const mongoose = require('mongoose');

/**
 * TRANSACTION SCHEMA
 * Ini adalah struktur data untuk menyimpan setiap transaksi aset
 * 
 * Contoh data:
 * {
 *   assetType: "crypto",
 *   assetName: "Bitcoin",
 *   nominal: 5000000,
 *   transactionDate: "2025-12-27",
 *   description: "Beli Bitcoin untuk long term",
 *   createdAt: 2025-12-27T10:00:00.000Z
 * }
 */
const transactionSchema = new mongoose.Schema({
  assetType: {
    type: String,
    enum: ['btc', 'crypto', 'cash', 'gold', 'saham', 'barang'],
    required: [true, 'Asset type harus dipilih'],
  },
  // 'buy' = beli/nambah aset, 'sell' = jual/kurangi aset.
  // Default 'buy' supaya transaksi lama tetap terhitung sebagai pembelian.
  txType: {
    type: String,
    enum: ['buy', 'sell'],
    default: 'buy',
  },
  assetName: {
    type: String,
    required: [true, 'Nama asset harus diisi'],
    trim: true,
    minlength: [2, 'Nama asset minimal 2 karakter'],
    maxlength: [100, 'Nama asset maksimal 100 karakter'],
  },
  nominal: {
    type: Number,
    required: [true, 'Nominal harus diisi'],
    min: [0, 'Nominal harus positif'],
  },
  quantity: {
    type: Number,
    default: 0,
    min: [0, 'Jumlah harus positif'],
  },
  transactionDate: {
    type: Date,
    required: [true, 'Tanggal transaksi harus diisi'],
    validate: {
      validator: function(value) {
        return value <= new Date();  // Tidak boleh melebihi hari ini
      },
      message: 'Tanggal transaksi tidak boleh melebihi hari ini'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Deskripsi maksimal 500 karakter'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update timestamp sebelum save
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
