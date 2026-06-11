const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-ganti-di-produksi';

/**
 * Middleware: lindungi route agar hanya bisa diakses dengan token valid.
 * Token dikirim lewat header: Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Belum login. Token tidak ditemukan.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
