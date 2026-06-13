const CashFlow = require('../models/CashFlow');
const CashAccount = require('../models/CashAccount');

/** Ubah saldo rekening sebesar delta (boleh negatif). */
async function applyCashDelta(accountId, delta) {
  if (!accountId || !delta) return;
  const acc = await CashAccount.findById(accountId);
  if (!acc) return;
  acc.balance += delta;
  acc.lastUpdated = Date.now();
  await acc.save();
}

/** Hapus cashflow transfer yang tertaut ke sebuah sumber + balikkan efek saldonya. */
async function removeLinkedFlow(source, refId) {
  if (!source || !refId) return;
  const flows = await CashFlow.find({ source, refId: String(refId) });
  for (const f of flows) {
    await applyCashDelta(f.cashAccountId, f.flow === 'in' ? -f.amount : f.amount);
    await f.deleteOne();
  }
}

/**
 * Buat/replace cashflow transfer tertaut: hapus yang lama (balikkan saldo),
 * lalu buat yang baru bila cashAccountId valid (terapkan saldo).
 */
async function upsertLinkedFlow({ source, refId, cashAccountId, flow, amount, category, date, note }) {
  await removeLinkedFlow(source, refId);
  if (!cashAccountId || !amount || Number(amount) <= 0) return null;
  const acc = await CashAccount.findById(cashAccountId);
  if (!acc) return null;
  const cf = await CashFlow.create({
    type: 'transfer',
    flow,
    amount: Number(amount),
    category: category || 'Transfer',
    cashAccountId,
    date: date ? new Date(date) : new Date(),
    note: note || '',
    source,
    refId: String(refId),
  });
  await applyCashDelta(cashAccountId, flow === 'in' ? Number(amount) : -Number(amount));
  return cf;
}

module.exports = { applyCashDelta, removeLinkedFlow, upsertLinkedFlow };
