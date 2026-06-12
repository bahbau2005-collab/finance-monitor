import { useState } from 'react'
import Modal from './Modal'
import { authService } from '../services/api'

function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null) // { type, text }

  const reset = () => {
    setForm({ current: '', next: '', confirm: '' })
    setMsg(null)
    setShow(false)
  }

  const handleClose = () => {
    if (saving) return
    reset()
    onClose()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setMsg(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!form.current || !form.next || !form.confirm) {
      setMsg({ type: 'error', text: 'Semua kolom wajib diisi' })
      return
    }
    if (form.next.length < 6) {
      setMsg({ type: 'error', text: 'Password baru minimal 6 karakter' })
      return
    }
    if (form.next !== form.confirm) {
      setMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok' })
      return
    }
    setSaving(true)
    try {
      await authService.changePassword(form.current, form.next)
      setMsg({ type: 'success', text: 'Password berhasil diganti. Gunakan password baru saat login berikutnya.' })
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      const text = err?.response?.data?.message || 'Gagal mengganti password'
      setMsg({ type: 'error', text })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Ganti Password" subtitle="Password untuk masuk ke aplikasi">
      <form onSubmit={handleSubmit} className="space-y-4">
        {msg && (
          <div className={`p-3 rounded-lg border flex items-start gap-2 ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <span className="font-bold">{msg.type === 'success' ? '✓' : '✗'}</span>
            <span className="text-sm">{msg.text}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Saat Ini</label>
          <input type={show ? 'text' : 'password'} name="current" value={form.current} onChange={handleChange} className="input-field text-base" autoComplete="current-password" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
          <input type={show ? 'text' : 'password'} name="next" value={form.next} onChange={handleChange} className="input-field text-base" placeholder="Minimal 6 karakter" autoComplete="new-password" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ulangi Password Baru</label>
          <input type={show ? 'text' : 'password'} name="confirm" value={form.confirm} onChange={handleChange} className="input-field text-base" autoComplete="new-password" />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
          <input type="checkbox" checked={show} onChange={() => setShow(s => !s)} className="w-4 h-4" />
          Tampilkan password
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={handleClose} disabled={saving}>Tutup</button>
          <button type="submit" className="btn btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Ganti Password'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ChangePasswordModal
