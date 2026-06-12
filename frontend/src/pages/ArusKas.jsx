import { useEffect, useState } from 'react'
import { cashFlowService, cashService } from '../services/api'
import Modal from '../components/Modal'

const CATEGORIES = {
  income: ['Gaji', 'Bonus', 'Dividen', 'Hadiah', 'Penjualan', 'Lainnya'],
  expense: ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'],
}

const todayStr = () => new Date().toISOString().split('T')[0]
const formatCurrency = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

function ArusKas() {
  const [flows, setFlows] = useState([])
  const [cashAccounts, setCashAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const emptyForm = { type: 'expense', amount: '', category: 'Makan', cashAccountId: '', date: todayStr(), note: '' }
  const [form, setForm] = useState(emptyForm)

  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' })

  // Edit modal
  const [editing, setEditing] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  // Bulk select
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => { fetchFlows() }, [filters])
  useEffect(() => { fetchAccounts() }, [])

  const fetchFlows = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.type) params.type = filters.type
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      const res = await cashFlowService.getAll(params)
      setFlows(res.data?.data || [])
    } catch {
      setMsg({ type: 'error', text: 'Gagal mengambil data arus kas' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = () => {
    cashService.getAll().then(res => setCashAccounts(res.data?.data || [])).catch(() => setCashAccounts([]))
  }

  const accountName = (id) => cashAccounts.find(a => a._id === id)?.name || '—'

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Saat ganti tipe, set kategori default tipe tsb
      if (name === 'type') next.category = CATEGORIES[value][0]
      return next
    })
    setMsg(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!form.amount || Number(form.amount) <= 0) {
      setMsg({ type: 'error', text: 'Nominal harus lebih besar dari 0' })
      return
    }
    setSaving(true)
    try {
      await cashFlowService.create({
        ...form,
        amount: Number(form.amount),
        cashAccountId: form.cashAccountId || undefined,
      })
      setForm({ ...emptyForm, type: form.type, category: form.category })
      setMsg({ type: 'success', text: 'Tersimpan!' })
      setTimeout(() => setMsg(null), 2000)
      fetchFlows()
      fetchAccounts()
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Gagal menyimpan' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus catatan ini? Saldo rekening terkait akan dikembalikan.')) return
    try {
      await cashFlowService.delete(id)
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s })
      fetchFlows()
      fetchAccounts()
    } catch {
      alert('Gagal menghapus')
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(new Set(flows.map(f => f._id)))
    else setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Hapus ${selectedIds.size} catatan? Saldo rekening terkait akan dikembalikan.`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => cashFlowService.delete(id)))
      setSelectedIds(new Set())
      fetchFlows()
      fetchAccounts()
    } catch {
      alert('Gagal menghapus sebagian data')
    }
  }

  const openEdit = (f) => {
    setEditing({
      _id: f._id,
      type: f.type,
      amount: f.amount,
      category: f.category || 'Lainnya',
      cashAccountId: f.cashAccountId || '',
      date: new Date(f.date).toISOString().split('T')[0],
      note: f.note || '',
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditing(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'type') next.category = CATEGORIES[value][0]
      return next
    })
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (savingEdit) return
    if (!editing.amount || Number(editing.amount) <= 0) return
    setSavingEdit(true)
    try {
      await cashFlowService.update(editing._id, {
        ...editing,
        amount: Number(editing.amount),
        cashAccountId: editing.cashAccountId || null,
      })
      setEditing(null)
      fetchFlows()
      fetchAccounts()
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal memperbarui')
    } finally {
      setSavingEdit(false)
    }
  }

  // Ringkasan dari data yang sedang tampil
  const totalIn = flows.filter(f => f.type === 'income').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalOut = flows.filter(f => f.type === 'expense').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const net = totalIn - totalOut

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-ink mb-2">Arus Kas</h1>
        <p className="text-xs lg:text-sm text-gray-600">Catat pemasukan & pengeluaran harian (saldo Cash ikut diperbarui otomatis)</p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Pemasukan</p>
          <p className="text-xl lg:text-2xl font-bold figure-up">{formatCurrency(totalIn)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total Pengeluaran</p>
          <p className="text-xl lg:text-2xl font-bold figure-down">{formatCurrency(totalOut)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Selisih</p>
          <p className={`text-xl lg:text-2xl font-bold ${net >= 0 ? 'text-ink' : 'text-down'}`}>{net < 0 ? '− ' : ''}{formatCurrency(Math.abs(net))}</p>
        </div>
      </div>

      {/* INPUT FORM */}
      <div className="card">
        <h3 className="text-base lg:text-lg font-semibold text-ink mb-4">Catat Transaksi</h3>

        {/* Toggle income/expense */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-5">
          <button type="button" onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${form.type === 'income' ? 'bg-upfill text-white shadow' : 'text-gray-600 hover:text-ink'}`}>
            Pemasukan
          </button>
          <button type="button" onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${form.type === 'expense' ? 'bg-downfill text-white shadow' : 'text-gray-600 hover:text-ink'}`}>
            Pengeluaran
          </button>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg border text-sm ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-up' : 'bg-red-50 border-red-200 text-down'}`}>
            {msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">Nominal (Rp)</label>
            <input id="amount" type="number" inputMode="numeric" name="amount" value={form.amount} onChange={handleChange} className="input-field text-base" placeholder="Contoh: 50000" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select id="category" name="category" value={form.category} onChange={handleChange} className="input-field">
              {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cashAccountId" className="block text-sm font-medium text-gray-700 mb-2">{form.type === 'income' ? 'Masuk ke rekening' : 'Keluar dari rekening'}</label>
            <select id="cashAccountId" name="cashAccountId" value={form.cashAccountId} onChange={handleChange} className="input-field">
              <option value="">— Tidak update Cash (catat saja) —</option>
              {cashAccounts.map(a => <option key={a._id} value={a._id}>{a.name} ({formatCurrency(a.balance)})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
            <input id="date" type="date" name="date" value={form.date} onChange={handleChange} className="input-field text-base" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">Catatan (opsional)</label>
            <input id="note" type="text" name="note" value={form.note} onChange={handleChange} className="input-field text-base" placeholder="Misal: makan siang" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>

      {/* FILTER */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="fType" className="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
            <select id="fType" value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))} className="input-field">
              <option value="">Semua</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label htmlFor="fStart" className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
            <input id="fStart" type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label htmlFor="fEnd" className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
            <input id="fEnd" type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
          </div>
          <div className="flex items-end">
            <button onClick={() => setFilters({ type: '', startDate: '', endDate: '' })} className="btn btn-secondary w-full">Reset Filter</button>
          </div>
        </div>
      </div>

      {/* BULK ACTION */}
      {selectedIds.size > 0 && (
        <div className="flex justify-end">
          <button onClick={handleBulkDelete} className="btn btn-danger flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Hapus {selectedIds.size} Item
          </button>
        </div>
      )}

      {/* LIST */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : flows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Belum ada catatan arus kas</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" className="w-4 h-4" checked={flows.length > 0 && selectedIds.size === flows.length} onChange={toggleSelectAll} /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipe</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kategori</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rekening</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Nominal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Catatan</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {flows.map(f => (
                <tr key={f._id} className={`border-b border-gray-200 hover:bg-gray-50 ${selectedIds.has(f._id) ? 'bg-accentsoft' : ''}`}>
                  <td className="px-4 py-3 text-left"><input type="checkbox" className="w-4 h-4" checked={selectedIds.has(f._id)} onChange={() => toggleSelect(f._id)} /></td>
                  <td className="px-4 py-3 text-sm">{new Date(f.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${f.type === 'income' ? 'bg-upsoft text-upink' : 'bg-downsoft text-downink'}`}>
                      {f.type === 'income' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{f.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.cashAccountId ? accountName(f.cashAccountId) : '—'}</td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${f.type === 'income' ? 'text-up' : 'text-down'}`}>{f.type === 'income' ? '+ ' : '− '}{formatCurrency(f.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={f.note || ''}>{f.note || '-'}</td>
                  <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                    <button onClick={() => openEdit(f)} className="text-accentink hover:opacity-70 font-medium text-sm">Edit</button>
                    <button onClick={() => handleDelete(f._id)} className="text-down hover:opacity-70 font-medium text-sm">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Edit Arus Kas">
          <form onSubmit={submitEdit} className="space-y-4">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button type="button" onClick={() => handleEditChange({ target: { name: 'type', value: 'income' } })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${editing.type === 'income' ? 'bg-upfill text-white' : 'text-gray-600'}`}>Pemasukan</button>
              <button type="button" onClick={() => handleEditChange({ target: { name: 'type', value: 'expense' } })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium ${editing.type === 'expense' ? 'bg-downfill text-white' : 'text-gray-600'}`}>Pengeluaran</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal (Rp)</label>
                <input type="number" inputMode="numeric" name="amount" value={editing.amount} onChange={handleEditChange} className="input-field text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                <select name="category" value={editing.category} onChange={handleEditChange} className="input-field">
                  {CATEGORIES[editing.type].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rekening</label>
                <select name="cashAccountId" value={editing.cashAccountId} onChange={handleEditChange} className="input-field">
                  <option value="">— Tidak update Cash —</option>
                  {cashAccounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
                <input type="date" name="date" value={editing.date} onChange={handleEditChange} className="input-field text-base" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <input type="text" name="note" value={editing.note} onChange={handleEditChange} className="input-field text-base" />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={() => setEditing(null)}>Batal</button>
              <button type="submit" className="btn btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed" disabled={savingEdit}>{savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default ArusKas
