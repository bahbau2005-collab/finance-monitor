import { useEffect, useState } from 'react'
import { budgetService, cashFlowService } from '../services/api'
import { computeSpent } from '../lib/budget'

const formatCurrency = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

const PERIODS = [
  { key: 'daily', label: 'Harian', sub: 'Hari ini' },
  { key: 'weekly', label: 'Mingguan', sub: 'Minggu ini (sejak Senin)' },
  { key: 'monthly', label: 'Bulanan', sub: 'Bulan ini' },
]

function statusOf(limit, spent) {
  if (!limit || limit <= 0) return { set: false }
  const pct = (spent / limit) * 100
  let color = 'var(--up-fill)'
  let label = 'Aman'
  if (pct >= 100) { color = 'var(--down-fill)'; label = 'Lewat batas' }
  else if (pct >= 80) { color = 'var(--accent)'; label = 'Hampir batas' }
  return { set: true, pct: Math.min(100, pct), realPct: pct, over: spent > limit, remaining: limit - spent, color, label }
}

function Anggaran() {
  const [limits, setLimits] = useState({ daily: 0, weekly: 0, monthly: 0 })
  const [spent, setSpent] = useState({ daily: 0, weekly: 0, monthly: 0 })
  const [form, setForm] = useState({ daily: '', weekly: '', monthly: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [bRes, fRes] = await Promise.all([
        budgetService.get(),
        cashFlowService.getAll(),
      ])
      const lim = bRes.data?.data || { daily: 0, weekly: 0, monthly: 0 }
      setLimits(lim)
      setForm({ daily: lim.daily || '', weekly: lim.weekly || '', monthly: lim.monthly || '' })
      setSpent(computeSpent(fRes.data?.data || []))
    } catch {
      setMsg({ type: 'error', text: 'Gagal mengambil data anggaran' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setMsg(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const payload = {
        daily: Number(form.daily) || 0,
        weekly: Number(form.weekly) || 0,
        monthly: Number(form.monthly) || 0,
      }
      const res = await budgetService.update(payload)
      setLimits(res.data?.data || payload)
      setMsg({ type: 'success', text: 'Batas anggaran disimpan!' })
      setTimeout(() => setMsg(null), 2000)
    } catch {
      setMsg({ type: 'error', text: 'Gagal menyimpan' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-ink mb-2">Anggaran</h1>
        <p className="text-xs lg:text-sm text-inksoft">Batas pengeluaran (harian, mingguan, bulanan) — investasi & hutang tidak dihitung</p>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-inksoft">Memuat anggaran...</div>
      ) : (
        <>
          {/* STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERIODS.map(p => {
              const st = statusOf(limits[p.key], spent[p.key])
              return (
                <div key={p.key} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink">{p.label}</p>
                      <p className="text-[11px] text-inkfaint">{p.sub}</p>
                    </div>
                    {st.set && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--surface-2)', color: st.color }}>{st.label}</span>
                    )}
                  </div>

                  {st.set ? (
                    <>
                      <div className="flex items-baseline justify-between mt-3 mb-1">
                        <span className="text-lg font-bold text-ink">{formatCurrency(spent[p.key])}</span>
                        <span className="text-xs text-inksoft">/ {formatCurrency(limits[p.key])}</span>
                      </div>
                      <div className="w-full h-2.5 bg-surface2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${st.pct}%`, background: st.color }}></div>
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: st.over ? 'var(--down)' : 'var(--ink-soft)' }}>
                        {st.over
                          ? `Lewat ${formatCurrency(Math.abs(st.remaining))} (${st.realPct.toFixed(0)}%)`
                          : `Sisa ${formatCurrency(st.remaining)} (${st.realPct.toFixed(0)}%)`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-inkfaint mt-4">Belum diatur. Terpakai: {formatCurrency(spent[p.key])}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* FORM SET BATAS */}
          <div className="card max-w-2xl">
            <h3 className="text-base lg:text-lg font-semibold text-ink mb-4">Atur Batas Pengeluaran</h3>
            {msg && (
              <div className={`mb-4 p-3 rounded-lg border text-sm ${msg.type === 'success' ? 'bg-upsoft text-upink border-line' : 'bg-downsoft text-downink border-line'}`}>
                {msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {PERIODS.map(p => (
                <div key={p.key}>
                  <label htmlFor={p.key} className="block text-sm font-medium text-gray-700 mb-1.5">Batas {p.label} (Rp)</label>
                  <input id={p.key} type="number" inputMode="numeric" name={p.key} value={form[p.key]} onChange={handleChange} className="input-field text-base" placeholder="0 = tanpa batas" />
                </div>
              ))}
              <button type="submit" className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Batas'}</button>
            </form>
            <p className="text-xs text-inkfaint mt-3">Isi 0 untuk menonaktifkan batas pada periode tertentu.</p>
          </div>
        </>
      )}
    </div>
  )
}

export default Anggaran
