const Transaction = require('../models/Transaction');
const CashAccount = require('../models/CashAccount');

/**
 * Hitung sisa holding (quantity) sebuah aset saat ini.
 * Beli menambah, jual mengurangi. Dipakai untuk validasi jual.
 */
async function getCurrentHolding(assetType, assetName) {
  const result = await Transaction.aggregate([
    { $match: { assetType, assetName } },
    {
      $group: {
        _id: null,
        qty: {
          $sum: { $cond: [{ $eq: ['$txType', 'sell'] }, { $multiply: ['$quantity', -1] }, '$quantity'] },
        },
      },
    },
  ]);
  return result[0]?.qty || 0;
}

/**
 * CREATE TRANSACTION
 * Untuk menambah transaksi baru (beli atau jual)
 */
exports.createTransaction = async (req, res) => {
  try {
    const { assetType, assetName, nominal, transactionDate, description, quantity, txType, cashAccountId } = req.body;

    // Cek apakah semua field required sudah ada
    if (!assetType || !assetName || nominal == null || !transactionDate) {
      return res.status(400).json({
        success: false,
        message: 'Semua field required harus diisi',
      });
    }

    // Validasi nominal
    if (nominal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal harus positif',
      });
    }

    const type = txType === 'sell' ? 'sell' : 'buy';

    // For asset types that represent units, quantity should be provided
    const unitTypes = ['crypto', 'gold', 'saham', 'barang'];
    if (unitTypes.includes(assetType) && (quantity == null || isNaN(Number(quantity)))) {
      return res.status(400).json({ success: false, message: 'Quantity harus diisi untuk tipe aset ini' });
    }

    const qty = Number(quantity) || 0;

    // Validasi khusus penjualan: holding harus cukup
    let cashAccount = null;
    if (type === 'sell') {
      if (qty > 0) {
        const holding = await getCurrentHolding(assetType, assetName);
        if (qty > holding + 1e-9) {
          return res.status(400).json({
            success: false,
            message: `Jumlah jual (${qty}) melebihi holding saat ini (${holding}) untuk ${assetName}`,
          });
        }
      }

      // Jika ada rekening tujuan, hasil jual masuk ke Cash
      if (cashAccountId) {
        cashAccount = await CashAccount.findById(cashAccountId);
        if (!cashAccount) {
          return res.status(400).json({ success: false, message: 'Rekening Cash tujuan tidak ditemukan' });
        }
      }
    }

    // Buat transaksi baru
    const transaction = new Transaction({
      assetType,
      assetName,
      nominal,
      quantity: qty,
      txType: type,
      transactionDate: new Date(transactionDate),
      description: description || '',
    });

    // Simpan ke database
    await transaction.save();

    // Setelah transaksi tersimpan, tambahkan hasil jual ke rekening Cash
    if (cashAccount) {
      cashAccount.balance += Number(nominal);
      cashAccount.lastUpdated = Date.now();
      await cashAccount.save();
    }

    res.status(201).json({
      success: true,
      message: type === 'sell' ? 'Penjualan aset berhasil dicatat' : 'Transaksi berhasil ditambahkan',
      data: transaction,
      cashAccount: cashAccount || undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat membuat transaksi',
      error: error.message,
    });
  }
};

/**
 * IMPORT TRANSACTIONS
 * Untuk mengimpor beberapa transaksi sekaligus (bulk import)
 * Menerima payload: { transactions: [ { assetType, assetName, nominal, transactionDate, description }, ... ] }
 */
exports.importTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, message: 'Payload transactions harus berupa array dan tidak kosong' });
    }

    // Validate & create each transaction to ensure mongoose validations run
    const created = [];
    for (const t of transactions) {
      const { assetType, assetName, nominal, transactionDate, description, quantity } = t;
      if (!assetType || !assetName || nominal == null || !transactionDate) {
        return res.status(400).json({ success: false, message: 'Setiap transaksi harus memiliki assetType, assetName, nominal, transactionDate' });
      }

      const tx = new Transaction({
        assetType,
        assetName,
        nominal,
        quantity: Number(quantity) || 0,
        transactionDate: new Date(transactionDate),
        description: description || '',
      });

      await tx.validate();
      await tx.save();
      created.push(tx);
    }

    res.status(201).json({ success: true, message: 'Import transaksi berhasil', importedCount: created.length, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saat mengimport transaksi', error: error.message });
  }
};

/**
 * GET ALL TRANSACTIONS
 * Untuk mengambil semua transaksi dengan filter opsional
 */
exports.getTransactions = async (req, res) => {
  try {
    const { assetType, startDate, endDate } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (assetType) {
      filter.assetType = assetType;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        filter.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.transactionDate.$lte = new Date(endDate);
      }
    }

    // Ambil data dari database, sort by date terbaru
    const transactions = await Transaction.find(filter).sort({ transactionDate: -1 });

    res.status(200).json({
      success: true,
      message: 'Data transaksi berhasil diambil',
      total: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat mengambil data transaksi',
      error: error.message,
    });
  }
};

/**
 * GET SINGLE TRANSACTION
 * Untuk mengambil satu transaksi berdasarkan ID
 */
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data transaksi berhasil diambil',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat mengambil data transaksi',
      error: error.message,
    });
  }
};

/**
 * UPDATE TRANSACTION
 * Untuk mengupdate transaksi
 */
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { assetType, assetName, nominal, transactionDate, description, quantity, txType } = req.body;

    const updatePayload = {
      assetType,
      assetName,
      nominal,
      transactionDate: new Date(transactionDate),
      description,
    };
    if (quantity != null) updatePayload.quantity = Number(quantity);
    if (txType === 'buy' || txType === 'sell') updatePayload.txType = txType;

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true } // runValidators = jalankan validasi saat update
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaksi berhasil diupdate',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat mengupdate transaksi',
      error: error.message,
    });
  }
};

/**
 * DELETE TRANSACTION
 * Untuk menghapus transaksi
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaksi berhasil dihapus',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat menghapus transaksi',
      error: error.message,
    });
  }
};

/**
 * GET DASHBOARD SUMMARY
 * Untuk mendapatkan ringkasan data untuk dashboard
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    // Nilai bertanda: beli (+), jual (-). Dipakai agar penjualan mengurangi total & holding.
    const signedNominal = { $cond: [{ $eq: ['$txType', 'sell'] }, { $multiply: ['$nominal', -1] }, '$nominal'] };
    const signedQuantity = { $cond: [{ $eq: ['$txType', 'sell'] }, { $multiply: ['$quantity', -1] }, '$quantity'] };

    // Total nominal per asset type (net: beli - jual)
    const summaryByAssetType = await Transaction.aggregate([
      {
        $group: {
          _id: '$assetType',
          total: { $sum: signedNominal },
          count: { $sum: 1 },
          sumQuantity: { $sum: signedQuantity },
        },
      },
    ]);

    // Total semua aset (net)
    const totalAssets = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: signedNominal },
        },
      },
    ]);

    // Transaksi terbaru (10 terakhir)
    const recentTransactions = await Transaction.find()
      .sort({ transactionDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: 'Dashboard summary berhasil diambil',
      data: {
        totalAssets: totalAssets[0]?.total || 0,
        byAssetType: summaryByAssetType,
        recentTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat mengambil dashboard summary',
      error: error.message,
    });
  }
};
