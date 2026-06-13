const Budget = require('../models/Budget');

async function getSingleton() {
  let b = await Budget.findOne();
  if (!b) b = await Budget.create({ daily: 0, weekly: 0, monthly: 0 });
  return b;
}

// GET /api/budget — ambil batas anggaran
exports.getBudget = async (req, res) => {
  try {
    const b = await getSingleton();
    res.status(200).json({ success: true, data: { daily: b.daily, weekly: b.weekly, monthly: b.monthly } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error mengambil anggaran', error: err.message });
  }
};

// PUT /api/budget — set batas anggaran
exports.updateBudget = async (req, res) => {
  try {
    const { daily, weekly, monthly } = req.body;
    const b = await getSingleton();
    if (daily != null) b.daily = Math.max(0, Number(daily) || 0);
    if (weekly != null) b.weekly = Math.max(0, Number(weekly) || 0);
    if (monthly != null) b.monthly = Math.max(0, Number(monthly) || 0);
    b.updatedAt = Date.now();
    await b.save();
    res.status(200).json({ success: true, message: 'Anggaran disimpan', data: { daily: b.daily, weekly: b.weekly, monthly: b.monthly } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error menyimpan anggaran', error: err.message });
  }
};
