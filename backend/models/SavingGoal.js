const mongoose = require('mongoose');

/**
 * SAVING GOAL SCHEMA
 * Ini adalah struktur data untuk menyimpan target/goals saving user
 * 
 * Contoh data:
 * {
 *   goalName: "Nabung untuk liburan",
 *   targetAmount: 50000000,
 *   currentAmount: 15000000,
 *   deadline: "2026-12-31",
 *   description: "Liburan ke Bali"
 * }
 */
const savingGoalSchema = new mongoose.Schema({
  goalName: {
    type: String,
    required: [true, 'Nama goal harus diisi'],
    trim: true,
    minlength: [2, 'Nama goal minimal 2 karakter'],
    maxlength: [100, 'Nama goal maksimal 100 karakter'],
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount harus diisi'],
    min: [0, 'Target amount harus positif'],
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount harus positif atau 0'],
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline harus diisi'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Deskripsi maksimal 500 karakter'],
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update timestamp sebelum save
savingGoalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SavingGoal = mongoose.model('SavingGoal', savingGoalSchema);

module.exports = SavingGoal;
