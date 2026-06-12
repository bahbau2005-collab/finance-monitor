const Target = require('../models/Target');
const Transaction = require('../models/Transaction');
const CashAccount = require('../models/CashAccount');

/**
 * Hitung holding (quantity bertanda) per assetType dan total cash,
 * lalu lampirkan nilai "current" ke setiap target.
 */
async function attachCurrent(targets) {
  const signedQty = { $cond: [{ $eq: ['$txType', 'sell'] }, { $multiply: ['$quantity', -1] }, '$quantity'] };
  const holdings = await Transaction.aggregate([
    { $group: { _id: '$assetType', qty: { $sum: signedQty } } },
  ]);
  const holdingMap = {};
  holdings.forEach(h => { holdingMap[h._id] = h.qty; });

  const cashAgg = await CashAccount.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
  const cashTotal = cashAgg[0]?.total || 0;

  return targets.map(t => {
    const obj = t.toObject ? t.toObject() : t;
    let current = 0;
    if (obj.kind === 'asset') current = holdingMap[obj.assetType] || 0;
    else if (obj.kind === 'cash') current = cashTotal;
    else current = obj.currentManual || 0;
    return { ...obj, current };
  });
}

exports.createTarget = async (req, res) => {
  try {
    const { name, kind, assetType, targetAmount, currentManual, deadline, note } = req.body;
    if (!name || !kind || targetAmount == null) {
      return res.status(400).json({ success: false, message: 'Nama, jenis, dan jumlah target wajib diisi' });
    }
    if (kind === 'asset' && !assetType) {
      return res.status(400).json({ success: false, message: 'Pilih jenis aset untuk target aset' });
    }
    if (Number(targetAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah target harus lebih besar dari 0' });
    }

    const target = new Target({
      name,
      kind,
      assetType: kind === 'asset' ? assetType : null,
      targetAmount: Number(targetAmount),
      currentManual: kind === 'manual' ? Number(currentManual) || 0 : 0,
      deadline: deadline ? new Date(deadline) : null,
      note: note || '',
    });
    await target.save();
    const [withCurrent] = await attachCurrent([target]);
    res.status(201).json({ success: true, message: 'Target berhasil dibuat', data: withCurrent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat membuat target', error: error.message });
  }
};

exports.getTargets = async (req, res) => {
  try {
    const targets = await Target.find().sort({ createdAt: -1 });
    const data = await attachCurrent(targets);
    res.status(200).json({ success: true, total: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat mengambil target', error: error.message });
  }
};

exports.updateTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, kind, assetType, targetAmount, currentManual, deadline, note } = req.body;
    const target = await Target.findById(id);
    if (!target) return res.status(404).json({ success: false, message: 'Target tidak ditemukan' });

    if (name != null) target.name = name;
    if (kind) target.kind = kind;
    if (kind === 'asset' || target.kind === 'asset') target.assetType = (kind === 'asset' || target.kind === 'asset') ? (assetType || target.assetType) : null;
    if (kind && kind !== 'asset') target.assetType = null;
    if (targetAmount != null) target.targetAmount = Number(targetAmount);
    if (currentManual != null) target.currentManual = Number(currentManual);
    if (deadline !== undefined) target.deadline = deadline ? new Date(deadline) : null;
    if (note != null) target.note = note;
    await target.save();

    const [withCurrent] = await attachCurrent([target]);
    res.status(200).json({ success: true, message: 'Target berhasil diperbarui', data: withCurrent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat memperbarui target', error: error.message });
  }
};

exports.deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await Target.findByIdAndDelete(id);
    if (!target) return res.status(404).json({ success: false, message: 'Target tidak ditemukan' });
    res.status(200).json({ success: true, message: 'Target berhasil dihapus', data: target });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat menghapus target', error: error.message });
  }
};
