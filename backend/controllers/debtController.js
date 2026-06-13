const Debt = require('../models/Debt');
const { upsertLinkedFlow, removeLinkedFlowsByPrefix } = require('../lib/ledger');

/**
 * Sinkronkan semua cashflow transfer tertaut sebuah hutang/piutang:
 * - pokok (saat dibuat): hutang = uang masuk, piutang = uang keluar
 * - tiap cicilan: hutang = bayar (keluar), piutang = terima (masuk)
 * Dipanggil tiap kali data/cicilan berubah. Aman dipanggil berulang (idempoten).
 */
async function syncDebt(debt) {
  const isHutang = debt.type === 'hutang';

  // Pokok
  await upsertLinkedFlow({
    source: 'debt',
    refId: `${debt._id}:prin`,
    cashAccountId: debt.cashAccountId,
    flow: isHutang ? 'in' : 'out',
    amount: debt.amount,
    category: isHutang ? 'Terima Pinjaman' : 'Beri Pinjaman',
    date: debt.date,
    note: debt.personName,
  });

  // Cicilan — bangun ulang dari kondisi terbaru
  await removeLinkedFlowsByPrefix('debt', `${debt._id}:pay:`);
  const pays = debt.payments || [];
  for (let i = 0; i < pays.length; i++) {
    const p = pays[i];
    if (!p.cashAccountId) continue;
    await upsertLinkedFlow({
      source: 'debt',
      refId: `${debt._id}:pay:${i}`,
      cashAccountId: p.cashAccountId,
      flow: isHutang ? 'out' : 'in',
      amount: p.amount,
      category: isHutang ? 'Bayar Hutang' : 'Terima Piutang',
      date: p.date,
      note: debt.personName,
    });
  }
}

// Create
exports.createDebt = async (req, res) => {
  try {
    const { type, personName, amount, date, reason, status, cashAccountId } = req.body;
    if (!type || !personName || amount == null || !date) {
      return res.status(400).json({ message: 'Field wajib: type, personName, amount, date' });
    }
    const debt = await Debt.create({ type, personName, amount, date, reason, status, cashAccountId: cashAccountId || null });
    await syncDebt(debt);
    return res.status(201).json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal membuat data', error: err.message });
  }
};

// Read all (with optional filters)
exports.getDebts = async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    const q = {};
    if (type) q.type = type;
    if (status) q.status = status;
    if (startDate || endDate) {
      q.date = {};
      if (startDate) q.date.$gte = new Date(startDate);
      if (endDate) q.date.$lte = new Date(endDate);
    }
    const debts = await Debt.find(q).sort({ date: -1, createdAt: -1 });
    return res.json({ data: debts });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};

// Read one
exports.getDebtById = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengambil data', error: err.message });
  }
};

// Update
exports.updateDebt = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.cashAccountId === '' ) updates.cashAccountId = null;
    const debt = await Debt.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });
    await syncDebt(debt);
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengupdate data', error: err.message });
  }
};

// Delete
exports.deleteDebt = async (req, res) => {
  try {
    // Balikkan semua efek Cash (pokok + cicilan) sebelum hapus
    await removeLinkedFlowsByPrefix('debt', `${req.params.id}:`);
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });
    return res.json({ message: 'Data dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus data', error: err.message });
  }
};

// Update status only, with force-done toggle snapshot support
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['onprogress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });

    if (status === 'done') {
      // If not fully paid yet, force to done and snapshot current progress
      const alreadyFullyPaid = Number(debt.paid || 0) >= Number(debt.amount || 0);
      if (!alreadyFullyPaid) {
        debt.forcedDoneSnapshot = {
          paid: Number(debt.paid || 0),
          payments: (debt.payments || []).map(p => ({ amount: p.amount, date: p.date, note: p.note })),
        };
        debt.paid = Number(debt.amount || 0);
      }
      debt.status = 'done';
      await debt.save();
      return res.json({ data: debt });
    }

    // status === 'onprogress': if previously forced done, restore snapshot
    if (status === 'onprogress') {
      if (debt.forcedDoneSnapshot && debt.forcedDoneSnapshot.paid != null) {
        debt.paid = Number(debt.forcedDoneSnapshot.paid || 0);
        debt.payments = (debt.forcedDoneSnapshot.payments || []).map(p => ({ amount: p.amount, date: p.date, note: p.note }));
        debt.forcedDoneSnapshot = { paid: null, payments: [] };
      }
      debt.status = 'onprogress';
      await debt.save();
      return res.json({ data: debt });
    }

    // Fallback (shouldn't reach here)
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengupdate status', error: err.message });
  }
};

// Add payment (partial repayment or collection)
exports.addPayment = async (req, res) => {
  try {
    const { amount, date, note, cashAccountId } = req.body;
    if (amount == null || Number(amount) <= 0 || !date) {
      return res.status(400).json({ message: 'Field wajib: amount (>0) dan date' });
    }
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });

    debt.payments.push({ amount: Number(amount), date: new Date(date), note: note || '', cashAccountId: cashAccountId || null });

    // Recalculate total paid and status
    debt.paid = (debt.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    debt.status = debt.paid >= debt.amount ? 'done' : 'onprogress';

    await debt.save();
    await syncDebt(debt);
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menambah pembayaran', error: err.message });
  }
};

// Update a specific payment entry (by index)
exports.updatePayment = async (req, res) => {
  try {
    const { amount, date, note, cashAccountId } = req.body;
    const index = Number(req.params.index);
    if (amount == null || Number(amount) <= 0 || !date) {
      return res.status(400).json({ message: 'Field wajib: amount (>0) dan date' });
    }

    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });
    if (!Array.isArray(debt.payments) || index < 0 || index >= debt.payments.length) {
      return res.status(400).json({ message: 'Pembayaran tidak ditemukan' });
    }

    debt.payments[index].amount = Number(amount);
    debt.payments[index].date = new Date(date);
    debt.payments[index].note = note || '';
    if (cashAccountId !== undefined) debt.payments[index].cashAccountId = cashAccountId || null;

    debt.paid = (debt.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    debt.status = debt.paid >= debt.amount ? 'done' : 'onprogress';

    await debt.save();
    await syncDebt(debt);
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengupdate pembayaran', error: err.message });
  }
};

// Delete a specific payment entry (by index)
exports.deletePayment = async (req, res) => {
  try {
    const index = Number(req.params.index);
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });
    if (!Array.isArray(debt.payments) || index < 0 || index >= debt.payments.length) {
      return res.status(400).json({ message: 'Pembayaran tidak ditemukan' });
    }

    debt.payments.splice(index, 1);
    debt.paid = (debt.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    debt.status = debt.paid >= debt.amount ? 'done' : 'onprogress';

    await debt.save();
    await syncDebt(debt);
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus pembayaran', error: err.message });
  }
};
