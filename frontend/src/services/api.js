import axios from 'axios';

/**
 * API SERVICE
 * File ini berisi semua function untuk komunikasi dengan backend
 * Ini centralkan untuk memudahkan maintenance
 */

// Get backend URL dynamically
const getBackendURL = () => {
  // Produksi/hosting: pakai URL backend dari environment variable (di-set di Vercel)
  // Contoh: VITE_API_URL=https://keuangan-api.onrender.com
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Development lokal: deteksi dari hostname browser
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : `http://${hostname}:5000`;
};

const API_BASE_URL = `${getBackendURL()}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// AUTH HELPERS & INTERCEPTORS
// ============================================

const TOKEN_KEY = 'keuangan_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Lampirkan token ke setiap request bila ada
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Bila server menolak (401 = token invalid/kedaluwarsa), hapus token & arahkan ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      // Hindari loop bila yang gagal adalah proses login itu sendiri
      if (!error.config?.url?.includes('/auth/login')) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (password) => api.post('/auth/login', { password }),
  verify: () => api.get('/auth/verify'),
};

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
  updatePayment: (id, index, payload) => api.put(`/debts/${id}/payments/${index}`, payload),
  deletePayment: (id, index) => api.delete(`/debts/${id}/payments/${index}`),
  delete: (id) => api.delete(`/debts/${id}`),
};

// ============================================
// HEALTH CHECK
// ============================================

export const healthCheck = () => api.get('/health');

export default api;
