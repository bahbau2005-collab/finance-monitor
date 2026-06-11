const mongoose = require('mongoose');

/**
 * DATABASE CONNECTION
 * Dibuat aman untuk lingkungan serverless (Vercel): koneksi di-cache dan
 * dipakai ulang antar request agar tidak membuat koneksi baru terus-menerus.
 */

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // Jika sudah terhubung, pakai ulang
  if (cached.conn) {
    return cached.conn;
  }

  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/keuangan-app';

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoURI, {
      // opsi default sudah cukup untuk driver versi baru
    }).then((m) => {
      console.log('✅ MongoDB connected successfully');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
