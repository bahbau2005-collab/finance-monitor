const express = require('express');
const router = express.Router();
const cashController = require('../controllers/cashController');

/**
 * CASH ROUTES
 * POST   /api/cash            - create account
 * GET    /api/cash            - get all accounts
 * GET    /api/cash/:id        - get account
 * PUT    /api/cash/:id        - update account
 * PATCH  /api/cash/:id/balance - update balance
 * DELETE /api/cash/:id        - delete account
 */

router.post('/', cashController.createAccount);
router.get('/', cashController.getAccounts);
router.get('/:id', cashController.getAccountById);
router.put('/:id', cashController.updateAccount);
router.patch('/:id/balance', cashController.updateBalance);
router.delete('/:id', cashController.deleteAccount);

module.exports = router;
