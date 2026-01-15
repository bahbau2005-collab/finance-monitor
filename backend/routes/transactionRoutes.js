const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

/**
 * TRANSACTION ROUTES
 * 
 * POST   /api/transactions              - Buat transaksi baru
 * GET    /api/transactions              - Ambil semua transaksi
 * GET    /api/transactions/:id          - Ambil satu transaksi
 * PUT    /api/transactions/:id          - Update transaksi
 * DELETE /api/transactions/:id          - Hapus transaksi
 * GET    /api/transactions/dashboard/summary - Ambil summary dashboard
 */

// Dashboard Summary (HARUS DI ATAS sebelum /:id route)
router.get('/dashboard/summary', transactionController.getDashboardSummary);

// Bulk import (Excel/JSON import)
router.post('/import', transactionController.importTransactions);

// CRUD Transactions
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
