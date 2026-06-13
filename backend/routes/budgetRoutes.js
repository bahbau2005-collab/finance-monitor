const express = require('express');
const router = express.Router();
const { getBudget, updateBudget } = require('../controllers/budgetController');

router.get('/', getBudget);
router.put('/', updateBudget);

module.exports = router;
