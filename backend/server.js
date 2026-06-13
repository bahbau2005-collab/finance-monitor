require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const savingGoalRoutes = require('./routes/savingGoalRoutes');
const cashRoutes = require('./routes/cashRoutes');
const cashFlowRoutes = require('./routes/cashFlowRoutes');
const targetRoutes = require('./routes/targetRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const debtRoutes = require('./routes/debtRoutes');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// CORS - Allow frontend di localhost:3000 dan jaringan lokal untuk request ke backend
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// Parse JSON request body
app.use(express.json({ limit: '50mb' }));

// ============================================
// DATABASE CONNECTION (lazy, aman untuk serverless)
// Pastikan koneksi siap sebelum menangani request data.
// ============================================
app.use(async (req, res, next) => {
  // Endpoint ringan yang tidak butuh DB boleh lewat tanpa menunggu koneksi
  if (req.path === '/' || req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database belum siap, coba lagi sebentar.' });
  }
});

// ============================================
// API ROUTES
// ============================================

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Monitor API Server',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date(),
  });
});

// Auth routes (login) — TIDAK dikunci, ini pintu masuknya
app.use('/api/auth', authRoutes);

// Semua route data di bawah ini DIKUNCI: wajib token valid (requireAuth)

// Transaction routes
app.use('/api/transactions', requireAuth, transactionRoutes);

// Saving Goal routes
app.use('/api/goals', requireAuth, savingGoalRoutes);

// Cash account routes
app.use('/api/cash', requireAuth, cashRoutes);

// Cash flow (pemasukan & pengeluaran) routes
app.use('/api/cashflow', requireAuth, cashFlowRoutes);

// Target (target akumulasi aset/cash) routes
app.use('/api/targets', requireAuth, targetRoutes);

// Budget (batas pengeluaran) routes
app.use('/api/budget', requireAuth, budgetRoutes);

// Debt & Receivable routes
app.use('/api/debts', requireAuth, debtRoutes);

// ============================================
// ERROR HANDLING - 404 Not Found
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan',
    path: req.path,
  });
});

// ============================================
// START SERVER
// Di lokal: jalankan app.listen seperti biasa.
// Di Vercel (serverless): app cukup di-export, jangan listen.
// ============================================
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🚀 Keuangan API Server Running      ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV}           ║
╚════════════════════════════════════════╝
  `);
  });
}

module.exports = app;
