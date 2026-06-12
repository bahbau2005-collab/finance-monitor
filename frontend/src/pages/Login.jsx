import { useState } from 'react'
import { authService, setToken } from '../services/api'

function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!password) {
      setError('Password wajib diisi')
      return
    }
    setLoading(true)
    try {
      const res = await authService.login(password)
      const token = res.data?.token
      if (!token) throw new Error('Token tidak diterima')
      setToken(token)
      onSuccess()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal login. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-ink px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accentsoft text-accentink mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l7-4 7 4-7 4-7-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l7 4 7-4M5 16l7 4 7-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink">Finance Monitor</h1>
          <p className="text-sm text-inksoft mt-1">Masuk untuk mengakses data keuangan Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-xl border border-line p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-red-600 font-bold">✗</span>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                className="input-field pr-12"
                placeholder="Masukkan password"
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">© 2025 Finance Monitor</p>
      </div>
    </div>
  )
}

export default Login
