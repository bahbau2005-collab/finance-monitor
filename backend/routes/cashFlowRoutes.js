const express = require('express');
const router = express.Router();
const {
  createCashFlow,
  getCashFlows,
  updateCashFlow,
  deleteCashFlow,
} = require('../controllers/cashFlowController');

router.post('/', createCashFlow);
router.get('/', getCashFlows);
router.put('/:id', updateCashFlow);
router.delete('/:id', deleteCashFlow);

module.exports = router;
