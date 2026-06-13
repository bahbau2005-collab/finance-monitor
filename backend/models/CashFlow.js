const mongoose = require('mongoose');

/**
 * CASH FLOW — catatan arus kas (ledger tunggal semua pergerakan uang).
 * type:
 *   - income   : pemasukan sungguhan (gaji, dll) -> menambah saldo
 *   - expense  : pengeluaran sungguhan (makan, dll) -> mengurangi saldo
 *   - transfer : perpindahan (beli/jual aset, hutang/piutang). Bukan income/expense,
 *                tidak ikut dihitung di laporan tabungan, tapi tetap mengubah saldo Cash.
 * flow: 'in' menambah saldo, 'out' mengurangi (dipakai utama untuk transfer;
 *       income otomatis 'in', expense otomatis 'out').
 * source: 'manual' (dibuat user di Arus Kas) | 'asset' | 'debt' (otomatis dari menu lain).
 * refId: id sumber (untuk sinkronisasi saat sumber diubah/dihapus).
 */
const cashFlowSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: [true, 'Tipe harus diisi'],
  },
  flow: { type: String, enum: ['in', 'out'], default: null },
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
  source: { type: String, enum: ['manual', 'asset', 'debt'], default: 'manual' },
  refId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('CashFlow', cashFlowSchema);
