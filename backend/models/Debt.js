const mongoose = require('mongoose');

/**
 * DEBT/RECEIVABLE SCHEMA
 * type: 'hutang' (we owe) | 'piutang' (others owe us)
 * status: 'onprogress' | 'done'
 */
const debtSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['hutang', 'piutang'],
    required: true,
  },
  personName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paid: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Rekening Cash terkait pokok (saat dibuat). Opsional.
  // hutang: uang masuk ke rekening ini; piutang: uang keluar dari rekening ini.
  cashAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashAccount',
    default: null,
  },
  payments: [
    {
      amount: { type: Number, required: true, min: 0 },
      date: { type: Date, required: true },
      note: { type: String, trim: true, default: '' },
      // Rekening Cash untuk cicilan ini (opsional)
      cashAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'CashAccount', default: null },
      _id: false,
    }
  ],
  // Snapshot to support toggling status: when forcing done, we store
  // the previous progress so that toggling back to onprogress can restore it.
  forcedDoneSnapshot: {
    paid: { type: Number, default: null },
    payments: [
      {
        amount: { type: Number, min: 0 },
        date: { type: Date },
        note: { type: String, trim: true, default: '' },
        _id: false,
      }
    ],
  },
  date: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  status: {
    type: String,
    enum: ['onprogress', 'done'],
    default: 'onprogress',
  },
}, { timestamps: true });

module.exports = mongoose.model('Debt', debtSchema);
