import { useEffect, useState } from 'react'
import { targetService } from '../services/api'
import Modal from '../components/Modal'

const ASSET_OPTIONS = [
  { value: 'gold', label: 'Emas / Logam Mulia' },
  { value: 'btc', label: 'Bitcoin (BTC)' },
  { value: 'crypto', label: 'Cryptocurrency (Other)' },
  { value: 'saham', label: 'Saham' },
  { value: 'barang', label: 'Barang Berharga' },
]

// Info satuan: div = pembagi dari satuan dasar ke satuan tampilan
function unitInfo(target) {
  if (target.kind === 'cash' || target.kind === 'manual') return { isRp: true, div: 1, unit: '' }
  switch (target.assetType) {
    case 'gold': return { isRp: false, div: 1, unit: 'gram' }
    case 'saham': return { isRp: false, div: 100, unit: 'lot' }
    case 'btc':
    case 'crypto': return { isRp: false, div: 1, unit: 'koin' }
    case 'barang': return { isRp: false, div: 1, unit: 'unit' }
    default: return { isRp: false, div: 1, unit: '' }
  }
}

const numFmt = (n) => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 4 })

// Format nilai (satuan dasar) untuk ditampilkan
function fmtBase(target, baseVal) {
  const u = unitInfo(target)
  if (u.isRp) return `Rp ${Number(baseVal || 0).toLocaleString('id-ID')}`
  return `${numFmt((baseVal || 0) / u.div)} ${u.unit}`
}

// Konversi input (satuan tampilan) -> satuan dasar untuk disimpan
function toBase(kind, assetType, inputVal) {
  const u = unitInfo({ kind, assetType })
  return Number(inputVal || 0) * (u.isRp ? 1 : u.div)
}
function fromBase(target, baseVal) {
  const u = unitInfo(target)
  return (baseVal || 0) / (u.isRp ? 1 : u.div)
}

function Target() {
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const emptyForm = { name: '', kind: 'asset', assetType: 'gold', amount: '', deadline: '', currentManual: '', note: '' }
  const [form, setForm] = useState(emptyForm)

  const [editing, setEditing] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => { fetchTargets() }, [])

  const fetchTargets = async () => {
    try {
      setLoading(true)
      const res = await targetService.getAll()
      setTargets(res.data?.data || [])
    } catch {
      setMsg({ type: 'error', text: 'Gagal mengambil data target' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setMsg(null)
  }

  const currentUnitLabel = (() => {
    if (form.kind === 'cash' || form.kind === 'manual') return 'Rp'
    return unitInfo({ kind: 'asset', assetType: form.assetType }).unit
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!form.name.trim()) { setMsg({ type: 'error', text: 'Nama target wajib diisi' }); return }
    if (!form.amount || Number(form.amount) <= 0) { setMsg({ type: 'error', text: 'Jumlah target harus lebih besar dari 0' }); return }
    setSaving(true)
    try {
      await targetService.create({
        name: form.name.trim(),
        kind: form.kind,
        assetType: form.kind === 'asset' ? form.assetType : undefined,
        targetAmount: toBase(form.kind, form.assetType, form.amount),
        currentManual: form.kind === 'manual' ? toBase(form.kind, form.assetType, form.currentManual) : 0,
        deadline: form.deadline || undefined,
        note: form.note,
      })
      setForm(emptyForm)
      setMsg({ type: 'success', text: 'Target dibuat!' })
      setTimeout(() => setMsg(null), 2000)
      fetchTargets()
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Gagal menyimpan target' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus target ini?')) return
    try {
      await targetService.delete(id)
      fetchTargets()
    } catch {
      alert('Gagal menghapus target')
    }
  }

  const openEdit = (t) => {
    setEditing({
      _id: t._id,
      name: t.name,
      kind: t.kind,
      assetType: t.assetType || 'gold',
      amount: fromBase(t, t.targetAmount),
      currentManual: t.kind === 'manual' ? fromBase(t, t.currentManual) : '',
      deadline: t.deadline ? new Date(t.deadline).toISOString().split('T')[0] : '',
      note: t.note || '',
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditing(prev => ({ ...prev, [name]: value }))
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (savingEdit) return
    if (!editing.amount || Number(editing.amount) <= 0) return
    setSavingEdit(true)
    try {
      await targetService.update(editing._id, {
        name: editing.name,
        kind: editing.kind,
        assetType: editing.kind === 'asset' ? editing.assetType : undefined,
        targetAmount: toBase(editing.kind, editing.assetType, editing.amount),
        currentManual: editing.kind === 'manual' ? toBase(editing.kind, editing.assetType, editing.currentManual) : 0,
        deadline: editing.deadline || null,
        note: editing.note,
      })
      setEditing(null)
      fetchTargets()
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal memperbarui')
    } finally {
      setSavingEdit(false)
    }
  }

  // Info progress + pace untuk satu target
  const progressOf = (t) => {
    const target = Number(t.targetAmount) || 0
    const current = Number(t.current) || 0
    const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
    const remaining = Math.max(0, target - current)
    const done = current >= target && target > 0

    let pace = null
    if (t.deadline && remaining > 0) {
      const days = (new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      if (days <= 0) pace = { late: true }
      else {
        const months = Math.max(days / 30.44, 0.0001)
        pace = { late: false, perMonth: remaining / months, monthsLeft: months }
      }
    }
    return { percent, remaining, done, pace }
  }

  const kindLabel = (t) => t.kind === 'asset' ? ASSET_OPTIONS.find(a => a.value === t.assetType)?.label || 'Aset' : (t.kind === 'cash' ? 'Cash' : 'Manual')

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-ink mb-2">Target</h1>
        <p className="text-xs lg:text-sm text-gray-600">Target akumulasi kekayaan (emas, BTC, saham, cash, dll) dengan progress otomatis</p>
      </div>

      {/* FORM */}
      <div className="card">
        <h3 className="text-base lg:text-lg font-semibold text-ink mb-4">Buat Target Baru</h3>

        {/* Toggle kind */}
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-5">
          {[{ k: 'asset', l: 'Aset' }, { k: 'cash', l: 'Cash' }, { k: 'manual', l: 'Manual' }].map(o => (
            <button key={o.k} type="button" onClick={() => handleChange({ target: { name: 'kind', value: o.k } })}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${form.kind === o.k ? 'bg-ink text-bg shadow' : 'text-inksoft hover:text-ink'}`}>
              {o.l}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 -mt-3 mb-4">
          {form.kind === 'asset' && 'Progress dihitung otomatis dari total holding aset di menu Aset.'}
          {form.kind === 'cash' && 'Progress dihitung otomatis dari total saldo semua rekening Cash.'}
          {form.kind === 'manual' && 'Progress diisi & diperbarui manual (untuk target di luar aplikasi).'}
        </p>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg border text-sm ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nama Target</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} className="input-field text-base" placeholder="Contoh: Pensiun Emas" />
          </div>

          {form.kind === 'asset' && (
            <div>
              <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">Jenis Aset</label>
              <select id="assetType" name="assetType" value={form.assetType} onChange={handleChange} className="input-field">
                {ASSET_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">Jumlah Target ({currentUnitLabel})</label>
            <input id="amount" type="number" inputMode="decimal" step="any" name="amount" value={form.amount} onChange={handleChange} className="input-field text-base" placeholder={form.kind === 'asset' && form.assetType === 'gold' ? 'Contoh: 1000 (gram)' : 'Contoh: 100000000'} />
          </div>

          {form.kind === 'manual' && (
            <div>
              <label htmlFor="currentManual" className="block text-sm font-medium text-gray-700 mb-2">Progress Saat Ini (Rp)</label>
              <input id="currentManual" type="number" inputMode="numeric" name="currentManual" value={form.currentManual} onChange={handleChange} className="input-field text-base" placeholder="0" />
            </div>
          )}

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">Target Tanggal (opsional)</label>
            <input id="deadline" type="date" name="deadline" value={form.deadline} onChange={handleChange} className="input-field text-base" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">Catatan (opsional)</label>
            <input id="note" name="note" value={form.note} onChange={handleChange} className="input-field text-base" placeholder="Misal: untuk dana pensiun" />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>{saving ? 'Menyimpan...' : 'Buat Target'}</button>
          </div>
        </form>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="card text-center py-12 text-gray-600">Memuat target...</div>
      ) : targets.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">Belum ada target. Buat target pertama lo di atas!</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {targets.map(t => {
            const { percent, remaining, done, pace } = progressOf(t)
            return (
              <div key={t._id} className="card">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <h4 className="font-semibold text-ink">{t.name}</h4>
                    <p className="text-xs text-gray-500">{kindLabel(t)}{t.note ? ` · ${t.note}` : ''}</p>
                  </div>
                  <div className="flex gap-2 text-sm shrink-0">
                    <button onClick={() => openEdit(t)} className="text-accentink hover:opacity-70 font-medium">Edit</button>
                    <button onClick={() => handleDelete(t._id)} className="text-red-500 hover:text-red-700 font-medium">Hapus</button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{fmtBase(t, t.current)}</span>
                    <span className="text-gray-500">dari {fmtBase(t, t.targetAmount)}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-accentink'}`} style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className={`font-semibold ${done ? 'text-green-600' : 'text-accentink'}`}>{percent.toFixed(1)}%</span>
                    {done ? (
                      <span className="text-green-600 font-medium">🎉 Tercapai!</span>
                    ) : (
                      <span className="text-gray-500">kurang {fmtBase(t, remaining)}</span>
                    )}
                  </div>
                </div>

                {/* Deadline & pace */}
                {t.deadline && !done && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    <p>🎯 Target: {new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    {pace?.late ? (
                      <p className="text-red-600 font-medium mt-1">Sudah lewat deadline</p>
                    ) : pace ? (
                      <p className="mt-1">Perlu nabung ±<span className="font-semibold text-gray-800">{fmtBase(t, pace.perMonth)}</span>/bulan ({Math.ceil(pace.monthsLeft)} bulan lagi)</p>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Edit Target">
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama</label>
              <input name="name" value={editing.name} onChange={handleEditChange} className="input-field text-base" />
            </div>
            {editing.kind === 'asset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Aset</label>
                <select name="assetType" value={editing.assetType} onChange={handleEditChange} className="input-field">
                  {ASSET_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Target ({editing.kind === 'asset' ? unitInfo({ kind: 'asset', assetType: editing.assetType }).unit : 'Rp'})</label>
                <input type="number" step="any" name="amount" value={editing.amount} onChange={handleEditChange} className="input-field text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Tanggal</label>
                <input type="date" name="deadline" value={editing.deadline} onChange={handleEditChange} className="input-field text-base" />
              </div>
            </div>
            {editing.kind === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Progress Saat Ini (Rp)</label>
                <input type="number" name="currentManual" value={editing.currentManual} onChange={handleEditChange} className="input-field text-base" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
              <input name="note" value={editing.note} onChange={handleEditChange} className="input-field text-base" />
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

export default Target
