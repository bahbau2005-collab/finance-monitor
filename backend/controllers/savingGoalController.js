const SavingGoal = require('../models/SavingGoal');

/**
 * CREATE SAVING GOAL
 */
exports.createSavingGoal = async (req, res) => {
  try {
    const { goalName, targetAmount, currentAmount, deadline, description } = req.body;

    if (!goalName || !targetAmount || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Semua field required harus diisi',
      });
    }

    const goal = new SavingGoal({
      goalName,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: new Date(deadline),
      description: description || '',
    });

    await goal.save();

    res.status(201).json({
      success: true,
      message: 'Saving goal berhasil ditambahkan',
      data: goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat membuat saving goal',
      error: error.message,
    });
  }
};

/**
 * GET ALL SAVING GOALS
 */
exports.getSavingGoals = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status) {
      filter.status = status;
    }

    const goals = await SavingGoal.find(filter).sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      message: 'Data saving goals berhasil diambil',
      total: goals.length,
      data: goals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat mengambil saving goals',
      error: error.message,
    });
  }
};

/**
 * GET SINGLE SAVING GOAL
 */
exports.getSavingGoalById = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await SavingGoal.findById(id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Saving goal tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data saving goal berhasil diambil',
      data: goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat mengambil saving goal',
      error: error.message,
    });
  }
};

/**
 * UPDATE SAVING GOAL
 */
exports.updateSavingGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { goalName, targetAmount, currentAmount, deadline, description, status } = req.body;

    const goal = await SavingGoal.findByIdAndUpdate(
      id,
      {
        goalName,
        targetAmount,
        currentAmount,
        deadline: new Date(deadline),
        description,
        status,
      },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Saving goal tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Saving goal berhasil diupdate',
      data: goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat mengupdate saving goal',
      error: error.message,
    });
  }
};

/**
 * DELETE SAVING GOAL
 */
exports.deleteSavingGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await SavingGoal.findByIdAndDelete(id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Saving goal tidak ditemukan',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Saving goal berhasil dihapus',
      data: goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saat menghapus saving goal',
      error: error.message,
    });
  }
};
