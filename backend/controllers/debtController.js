const Debt = require('../models/Debt');

// Create
exports.createDebt = async (req, res) => {
  try {
    const { type, personName, amount, date, reason, status, paid, photoUrl } = req.body;
    if (!type || !personName || amount == null || !date) {
      return res.status(400).json({ message: 'Field wajib: type, personName, amount, date' });
    }
    // Jika status done, otomatis set paid = amount
    const paidAmount = status === 'done' ? Number(amount) : (paid ? Number(paid) : 0);
    const debt = await Debt.create({ type, personName, amount, date, reason, status, paid: paidAmount, photoUrl: photoUrl || '' });
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
    // Jika status diubah ke done, otomatis set paid = amount
    if (updates.status === 'done' && updates.amount != null) {
      updates.paid = Number(updates.amount);
    }
    const debt = await Debt.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengupdate data', error: err.message });
  }
};

// Delete
exports.deleteDebt = async (req, res) => {
  try {
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
      } else {
        // Jika tidak ada snapshot (misalnya dibuat langsung dengan status done), reset paid ke 0
        debt.paid = 0;
        debt.payments = [];
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
    const { amount, date, note } = req.body;
    if (amount == null || Number(amount) <= 0 || !date) {
      return res.status(400).json({ message: 'Field wajib: amount (>0) dan date' });
    }
    const debt = await Debt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Data tidak ditemukan' });

    // push payment and increment paid
    debt.payments.push({ amount: Number(amount), date: new Date(date), note: note || '' });
    debt.paid = Number(debt.paid || 0) + Number(amount);

    // auto status update: done if fully paid/collected
    if (debt.paid >= debt.amount) {
      debt.status = 'done';
    } else {
      debt.status = 'onprogress';
    }

    await debt.save();
    return res.json({ data: debt });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menambah pembayaran', error: err.message });
  }
};
