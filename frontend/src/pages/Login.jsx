import { useState } from 'react'
import { authService, setToken } from '../services/api'

function Login({ onSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  // forgot state
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!password) { setError('Password wajib diisi'); return }
    setLoading(true)
    try {
      const res = await authService.login(password)
      const token = res.data?.token
      if (!token) throw new Error('Token tidak diterima')
      setToken(token)
      onSuccess()
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal login. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const openForgot = () => {
    setMode('forgot'); setError(null); setInfo(null); setCodeSent(false)
    setCode(''); setNewPass(''); setConfirmPass('')
  }
  const backToLogin = () => { setMode('login'); setError(null); setInfo(null) }

  const sendCode = async () => {
    setError(null); setInfo(null); setLoading(true)
    try {
      await authService.forgotPassword()
      setCodeSent(true)
      setInfo('Kode reset sudah dikirim ke email kamu. Cek inbox (atau folder spam).')
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengirim kode.')
    } finally { setLoading(false) }
  }

  const doReset = async (e) => {
    e.preventDefault()
    setError(null)
    if (!code || !newPass) { setError('Kode & password baru wajib diisi'); return }
    if (newPass.length < 6) { setError('Password baru minimal 6 karakter'); return }
    if (newPass !== confirmPass) { setError('Konfirmasi password tidak cocok'); return }
    setLoading(true)
    try {
      await authService.resetPassword(code.trim(), newPass)
      setMode('login'); setCodeSent(false); setPassword('')
      setInfo('Password berhasil direset. Silakan login dengan password baru.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal reset password.')
    } finally { setLoading(false) }
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
          <p className="text-sm text-inksoft mt-1">{mode === 'login' ? 'Masuk untuk mengakses data keuangan Anda' : 'Reset password lewat email'}</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl border border-line p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-line bg-downsoft flex items-start gap-2">
              <span className="text-downink font-bold">✗</span>
              <span className="text-sm text-downink">{error}</span>
            </div>
          )}
          {info && (
            <div className="p-3 rounded-lg border border-line bg-upsoft flex items-start gap-2">
              <span className="text-upink font-bold">✓</span>
              <span className="text-sm text-upink">{info}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600" aria-label="Tampilkan password">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
              <button type="button" onClick={openForgot} className="w-full text-center text-sm text-accentink hover:opacity-70">Lupa password?</button>
            </form>
          ) : (
            <div className="space-y-4">
              {!codeSent ? (
                <>
                  <p className="text-sm text-inksoft">Kami akan mengirim kode reset ke email kamu. Tekan tombol di bawah.</p>
                  <button type="button" onClick={sendCode} className="btn btn-primary w-full justify-center" disabled={loading}>
                    {loading ? 'Mengirim...' : 'Kirim kode ke email'}
                  </button>
                </>
              ) : (
                <form onSubmit={doReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode dari email</label>
                    <input value={code} onChange={e => { setCode(e.target.value); setError(null) }} className="input-field text-base tracking-widest" placeholder="6 digit" inputMode="numeric" autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                    <input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setError(null) }} className="input-field text-base" placeholder="Minimal 6 karakter" autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ulangi Password Baru</label>
                    <input type="password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(null) }} className="input-field text-base" autoComplete="new-password" />
                  </div>
                  <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>{loading ? 'Menyimpan...' : 'Reset Password'}</button>
                  <button type="button" onClick={sendCode} className="w-full text-center text-xs text-inksoft hover:text-ink" disabled={loading}>Kirim ulang kode</button>
                </form>
              )}
              <button type="button" onClick={backToLogin} className="w-full text-center text-sm text-inksoft hover:text-ink">← Kembali ke login</button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2025 Finance Monitor</p>
      </div>
    </div>
  )
}

export default Login
