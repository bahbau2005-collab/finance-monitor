require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Import routes
const transactionRoutes = require('./routes/transactionRoutes');
const savingGoalRoutes = require('./routes/savingGoalRoutes');
const cashRoutes = require('./routes/cashRoutes');
const debtRoutes = require('./routes/debtRoutes');

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
// DATABASE CONNECTION
// ============================================
connectDB();

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

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Saving Goal routes
app.use('/api/goals', savingGoalRoutes);

// Cash account routes
app.use('/api/cash', cashRoutes);

// Debt & Receivable routes
app.use('/api/debts', debtRoutes);

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
// ============================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Keuangan API Server Running      ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV}           ║
╚════════════════════════════════════════╝
  `);
});
