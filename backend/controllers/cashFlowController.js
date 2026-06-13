const CashFlow = require('../models/CashFlow');
const CashAccount = require('../models/CashAccount');

/**
 * Terapkan/balikkan efek arus kas ke saldo rekening.
 * sign = +1 untuk menerapkan, -1 untuk membalikkan.
 * income menambah saldo, expense mengurangi saldo.
 */
async function applyToAccount(accountId, type, amount, sign) {
  if (!accountId) return;
  const acc = await CashAccount.findById(accountId);
  if (!acc) return;
  const direction = type === 'income' ? 1 : -1;
  acc.balance += direction * Number(amount) * sign;
  acc.lastUpdated = Date.now();
  await acc.save();
}

/**
 * CREATE — catat pemasukan/pengeluaran (+ update saldo rekening bila ada)
 */
exports.createCashFlow = async (req, res) => {
  try {
    const { type, amount, category, cashAccountId, date, note } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipe harus income atau expense' });
    }
    if (amount == null || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal harus lebih besar dari 0' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Tanggal harus diisi' });
    }

    let account = null;
    if (cashAccountId) {
      account = await CashAccount.findById(cashAccountId);
      if (!account) {
        return res.status(400).json({ success: false, message: 'Rekening Cash tidak ditemukan' });
      }
    }

    const flow = new CashFlow({
      type,
      flow: type === 'income' ? 'in' : 'out',
      amount: Number(amount),
      category: category || 'Lainnya',
      cashAccountId: cashAccountId || null,
      date: new Date(date),
      note: note || '',
      source: 'manual',
    });
    await flow.save();

    if (account) {
      await applyToAccount(cashAccountId, type, amount, +1);
    }

    res.status(201).json({ success: true, message: 'Arus kas berhasil dicatat', data: flow });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat mencatat arus kas', error: error.message });
  }
};

/**
 * GET ALL — dengan filter type, kategori, rentang tanggal
 */
exports.getCashFlows = async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const flows = await CashFlow.find(filter).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, total: flows.length, data: flows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat mengambil arus kas', error: error.message });
  }
};

/**
 * UPDATE — balikkan efek lama ke saldo, lalu terapkan efek baru
 */
exports.updateCashFlow = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, cashAccountId, date, note } = req.body;

    const existing = await CashFlow.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data arus kas tidak ditemukan' });
    }
    if (existing.source && existing.source !== 'manual') {
      return res.status(400).json({ success: false, message: 'Entri ini otomatis dari menu lain. Ubah dari sumbernya (mis. menu Aset).' });
    }

    const newType = type && ['income', 'expense'].includes(type) ? type : existing.type;
    const newAmount = amount != null ? Number(amount) : existing.amount;
    const newAccountId = cashAccountId !== undefined ? (cashAccountId || null) : existing.cashAccountId;

    if (newAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal harus lebih besar dari 0' });
    }
    if (newAccountId) {
      const acc = await CashAccount.findById(newAccountId);
      if (!acc) return res.status(400).json({ success: false, message: 'Rekening Cash tidak ditemukan' });
    }

    // Balikkan efek lama
    await applyToAccount(existing.cashAccountId, existing.type, existing.amount, -1);

    // Update field
    existing.type = newType;
    existing.amount = newAmount;
    existing.category = category != null ? category : existing.category;
    existing.cashAccountId = newAccountId;
    if (date) existing.date = new Date(date);
    if (note != null) existing.note = note;
    await existing.save();

    // Terapkan efek baru
    await applyToAccount(newAccountId, newType, newAmount, +1);

    res.status(200).json({ success: true, message: 'Arus kas berhasil diperbarui', data: existing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat memperbarui arus kas', error: error.message });
  }
};

/**
 * DELETE — hapus + balikkan efek ke saldo rekening
 */
exports.deleteCashFlow = async (req, res) => {
  try {
    const { id } = req.params;
    const flow = await CashFlow.findById(id);
    if (!flow) {
      return res.status(404).json({ success: false, message: 'Data arus kas tidak ditemukan' });
    }
    if (flow.source && flow.source !== 'manual') {
      return res.status(400).json({ success: false, message: 'Entri ini otomatis dari menu lain. Hapus dari sumbernya (mis. menu Aset).' });
    }

    await applyToAccount(flow.cashAccountId, flow.type, flow.amount, -1);
    await flow.deleteOne();

    res.status(200).json({ success: true, message: 'Arus kas berhasil dihapus', data: flow });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat menghapus arus kas', error: error.message });
  }
};
