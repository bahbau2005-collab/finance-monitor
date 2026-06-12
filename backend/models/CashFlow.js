const mongoose = require('mongoose');

/**
 * CASH FLOW
 * Catatan arus kas harian: pemasukan (income) & pengeluaran (expense).
 * Bila terhubung ke sebuah rekening Cash (cashAccountId), saldo rekening
 * tersebut otomatis bertambah (income) atau berkurang (expense).
 */
const cashFlowSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Tipe (income/expense) harus diisi'],
  },
  amount: {
    type: Number,
    required: [true, 'Nominal harus diisi'],
    min: [0, 'Nominal harus positif'],
  },
  category: {
    type: String,
    trim: true,
    default: 'Lainnya',
    maxlength: [50, 'Kategori maksimal 50 karakter'],
  },
  cashAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashAccount',
    default: null,
  },
  date: {
    type: Date,
    required: [true, 'Tanggal harus diisi'],
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Catatan maksimal 500 karakter'],
  },
}, { timestamps: true });

module.exports = mongoose.model('CashFlow', cashFlowSchema);
