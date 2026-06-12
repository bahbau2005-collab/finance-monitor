const express = require('express');
const router = express.Router();
const { createTarget, getTargets, updateTarget, deleteTarget } = require('../controllers/targetController');

router.post('/', createTarget);
router.get('/', getTargets);
router.put('/:id', updateTarget);
router.delete('/:id', deleteTarget);

module.exports = router;
