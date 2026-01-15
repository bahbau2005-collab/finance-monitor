const express = require('express');
const router = express.Router();
const savingGoalController = require('../controllers/savingGoalController');

/**
 * SAVING GOAL ROUTES
 * 
 * POST   /api/goals              - Buat goal baru
 * GET    /api/goals              - Ambil semua goals
 * GET    /api/goals/:id          - Ambil satu goal
 * PUT    /api/goals/:id          - Update goal
 * DELETE /api/goals/:id          - Hapus goal
 */

router.post('/', savingGoalController.createSavingGoal);
router.get('/', savingGoalController.getSavingGoals);
router.get('/:id', savingGoalController.getSavingGoalById);
router.put('/:id', savingGoalController.updateSavingGoal);
router.delete('/:id', savingGoalController.deleteSavingGoal);

module.exports = router;
