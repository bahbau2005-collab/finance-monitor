const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');

router.post('/', debtController.createDebt);
router.get('/', debtController.getDebts);
router.get('/:id', debtController.getDebtById);
router.put('/:id', debtController.updateDebt);
router.delete('/:id', debtController.deleteDebt);
router.patch('/:id/status', debtController.updateStatus);
router.post('/:id/payments', debtController.addPayment);

module.exports = router;
