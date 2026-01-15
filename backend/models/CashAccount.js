const mongoose = require('mongoose');

const CashAccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CashAccount', CashAccountSchema);
