import axios from 'axios';

/**
 * API SERVICE
 * File ini berisi semua function untuk komunikasi dengan backend
 * Ini centralkan untuk memudahkan maintenance
 */

// Get backend URL dynamically
// Development: detect from window.location.hostname
const getBackendURL = () => {
  const isDevelopment = import.meta.env.MODE === 'development';
  
  if (isDevelopment) {
    // Get hostname from browser
    const hostname = window.location.hostname;
    const backendHost = hostname === 'localhost' || hostname === '127.0.0.1' 
      ? 'http://localhost:5000'
      : `http://${hostname}:5000`;
    return backendHost;
  }
  
  // Production: use current host
  return `${window.location.origin.replace(':3000', ':5000')}`;
};

const API_BASE_URL = `${getBackendURL()}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// TRANSACTION ENDPOINTS
// ============================================

export const transactionService = {
  // Buat transaksi baru
  create: (data) => api.post('/transactions', data),

  // Ambil semua transaksi
  getAll: (filters = {}) => api.get('/transactions', { params: filters }),

  // Ambil satu transaksi
  getById: (id) => api.get(`/transactions/${id}`),

  // Update transaksi
  update: (id, data) => api.put(`/transactions/${id}`, data),

  // Hapus transaksi
  delete: (id) => api.delete(`/transactions/${id}`),

  // Import bulk transactions (array)
  importTransactions: (payload) => api.post('/transactions/import', payload),

  // Ambil dashboard summary
  getDashboardSummary: () => api.get('/transactions/dashboard/summary'),
};

// ============================================
// SAVING GOAL ENDPOINTS
// ============================================

export const savingGoalService = {
  // Buat goal baru
  create: (data) => api.post('/goals', data),

  // Ambil semua goals
  getAll: (filters = {}) => api.get('/goals', { params: filters }),

  // Ambil satu goal
  getById: (id) => api.get(`/goals/${id}`),

  // Update goal
  update: (id, data) => api.put(`/goals/${id}`, data),

  // Hapus goal
  delete: (id) => api.delete(`/goals/${id}`),
};

// ============================================
// CASH ACCOUNT ENDPOINTS
// ============================================

export const cashService = {
  create: (data) => api.post('/cash', data),
  getAll: () => api.get('/cash'),
  getById: (id) => api.get(`/cash/${id}`),
  update: (id, data) => api.put(`/cash/${id}`, data),
  updateBalance: (id, data) => api.patch(`/cash/${id}/balance`, data),
  delete: (id) => api.delete(`/cash/${id}`),
};

// ============================================
// DEBT & RECEIVABLE ENDPOINTS
// ============================================

export const debtService = {
  create: (data) => api.post('/debts', data),
  getAll: (filters = {}) => api.get('/debts', { params: filters }),
  getById: (id) => api.get(`/debts/${id}`),
  update: (id, data) => api.put(`/debts/${id}`, data),
  updateStatus: (id, status) => api.patch(`/debts/${id}/status`, { status }),
  addPayment: (id, payload) => api.post(`/debts/${id}/payments`, payload),
  delete: (id) => api.delete(`/debts/${id}`),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = () => api.get('/health');

export default api;
