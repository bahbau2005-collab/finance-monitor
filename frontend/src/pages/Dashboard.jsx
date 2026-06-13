import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { transactionService, cashService, debtService, budgetService, cashFlowService } from '../services/api'
import { computeSpent } from '../lib/budget'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

// Lighten (pct>0) / darken (pct<0) sebuah warna hex — untuk efek kilau gradien
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const t = pct < 0 ? 0 : 255, p = Math.abs(pct)
  r = Math.round((t - r) * p) + r
  g = Math.round((t - g) * p) + g
  b = Math.round((t - b) * p) + b
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function Dashboard({ dark }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCash, setTotalCash] = useState(0)
  const [debtTotals, setDebtTotals] = useState({ hutang: 0, piutang: 0, hutangRemaining: 0, piutangRemaining: 0 })
  const [budget, setBudget] = useState({ limits: { daily: 0, weekly: 0, monthly: 0 }, spent: { daily: 0, weekly: 0, monthly: 0 } })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [response, cashResp, debtsResp, budgetResp, flowsResp] = await Promise.all([
        transactionService.getDashboardSummary(),
        cashService.getAll(),
        debtService.getAll(),
        budgetService.get(),
        cashFlowService.getAll(),
      ])

      const limits = budgetResp.data?.data || { daily: 0, weekly: 0, monthly: 0 }
      setBudget({ limits, spent: computeSpent(flowsResp.data?.data || []) })

      setSummary(response.data.data)
      const cashAccounts = cashResp.data.data || []
      const cashSum = cashAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0)
      setTotalCash(cashSum)
      const debts = debtsResp.data.data || []
      const hutang = debts.filter(d => d.type === 'hutang')
      const piutang = debts.filter(d => d.type === 'piutang')
      const sumAmt = (arr) => arr.reduce((s, d) => s + (Number(d.amount) || 0), 0)
      const sumRemain = (arr) => arr.reduce((s, d) => s + Math.max(0, Number(d.amount) - Number(d.paid || 0)), 0)
      setDebtTotals({ hutang: sumAmt(hutang), piutang: sumAmt(piutang), hutangRemaining: sumRemain(hutang), piutangRemaining: sumRemain(piutang) })
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard:', err)
      setError('Gagal mengambil data dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-accent mx-auto mb-4"></div>
          <p className="text-inksoft">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-down">{error}</div>
    )
  }

  const totalAssets = summary?.totalAssets || 0
  const byAssetType = summary?.byAssetType || []
  const recentTransactions = summary?.recentTransactions || []
  const combinedTotalAssets = (summary?.totalAssets || 0) + (totalCash || 0) + (debtTotals.piutangRemaining || 0)

  const formatQuantity = (qty, assetType) => {
    if (!qty || isNaN(qty)) return '-'
    if (assetType === 'btc' || assetType === 'crypto') return `${Number(qty).toFixed(8)} BTC`
    if (assetType === 'gold') return `${Number(qty).toFixed(4)} g`
    if (assetType === 'saham') return `${(Number(qty) / 100).toLocaleString('id-ID')} lot (${Number(qty).toLocaleString('id-ID')} lembar)`
    if (assetType === 'barang') return `${Number(qty).toLocaleString('id-ID')} unit`
    return qty
  }

  // Mode terang: kontras lebih tinggi & hue lebih beda biar gampang dibedain.
  // Mode gelap: palet lebih lembut (sudah pas).
  const PIE_COLORS = dark
    ? ['#B08C4A', '#7E7A70', '#5C7C58', '#C9A86A', '#B25C43']
    : ['#9A6F1E', '#4E4B45', '#2F7A55', '#7E5BB0', '#B5492B']

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-ink mb-2">Dashboard</h1>
        <p className="text-xs lg:text-sm text-inksoft">Ringkasan kekayaan & keuangan Anda</p>
      </div>

      {/* HERO — TOTAL KEKAYAAN */}
      <div className="card" style={{ borderTopWidth: '2px', borderTopColor: 'var(--accent)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-inksoft text-xs lg:text-sm">Total Kekayaan Bersih</p>
            <h2 className="text-3xl lg:text-5xl font-bold figure-gold mt-1 tracking-tight">Rp {combinedTotalAssets.toLocaleString('id-ID')}</h2>
            <p className="text-inkfaint text-xs mt-2">Aset investasi + Cash + Piutang belum tertagih</p>
          </div>
          <span className="hidden sm:flex w-12 h-12 rounded-2xl bg-accentsoft text-accentink items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4-9 4-9-4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 4 9-4M3 17l9 4 9-4" /></svg>
          </span>
        </div>
      </div>

      {/* METRIK UTAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface2 rounded-2xl p-4 lg:p-5 border border-line">
          <p className="text-inksoft text-xs">Total Cash</p>
          <p className="text-xl lg:text-2xl font-bold text-ink mt-1">Rp {Number(totalCash).toLocaleString('id-ID')}</p>
          <p className="text-inkfaint text-[11px] mt-1.5">Saldo semua rekening</p>
        </div>
        <div className="bg-surface2 rounded-2xl p-4 lg:p-5 border border-line">
          <p className="text-inksoft text-xs">Hutang Belum Terbayar</p>
          <p className="text-xl lg:text-2xl font-bold mt-1 figure-down">Rp {Number(debtTotals.hutangRemaining).toLocaleString('id-ID')}</p>
          <p className="text-inkfaint text-[11px] mt-1.5">Yang masih harus dibayar</p>
        </div>
        <div className="bg-surface2 rounded-2xl p-4 lg:p-5 border border-line">
          <p className="text-inksoft text-xs">Piutang Belum Tertagih</p>
          <p className="text-xl lg:text-2xl font-bold mt-1 figure-up">Rp {Number(debtTotals.piutangRemaining).toLocaleString('id-ID')}</p>
          <p className="text-inkfaint text-[11px] mt-1.5">Yang belum masuk</p>
        </div>
      </div>

      {/* ANGGARAN PENGELUARAN */}
      {(budget.limits.daily > 0 || budget.limits.weekly > 0 || budget.limits.monthly > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-bold text-ink">Anggaran Pengeluaran</h3>
            <Link to="/anggaran" className="text-xs text-accentink hover:opacity-70 font-medium">Atur →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[['daily', 'Harian'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan']].map(([k, label]) => {
              const limit = budget.limits[k]
              const spent = budget.spent[k]
              if (!limit || limit <= 0) return null
              const pct = (spent / limit) * 100
              const over = spent > limit
              const color = pct >= 100 ? 'var(--down-fill)' : (pct >= 80 ? 'var(--accent)' : 'var(--up-fill)')
              return (
                <div key={k} className="bg-surface2 rounded-xl p-4 border border-line">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-inksoft">{label}</span>
                    <span style={{ color }} className="font-medium">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }}></div>
                  </div>
                  <p className="text-[11px] mt-1.5 text-inkfaint">Rp {Number(spent).toLocaleString('id-ID')} / Rp {Number(limit).toLocaleString('id-ID')}{over ? ' · lewat batas!' : ''}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ASSET TYPE BREAKDOWN */}
      {byAssetType.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {byAssetType.map((item) => (
            <div key={item._id} className="card">
              <p className="text-inksoft text-xs lg:text-sm">{item._id === 'btc' ? 'BTC' : (item._id?.charAt(0).toUpperCase() + item._id?.slice(1))}</p>
              <p className="text-lg lg:text-2xl font-bold text-ink mt-1">Rp {item.total.toLocaleString('id-ID')}</p>
              <p className="text-inkfaint text-[11px] mt-1.5">{item.count} transaksi</p>
            </div>
          ))}
        </div>
      )}

      {/* QUANTITY BREAKDOWN */}
      <div className="card">
        <h3 className="text-base lg:text-lg font-bold text-ink mb-4">Total Jumlah Aset</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(() => {
            const byType = (t) => byAssetType.find(i => i._id === t) || {}
            return [
              { label: 'Bitcoin (BTC)', value: byType('btc').sumQuantity || 0, type: 'btc' },
              { label: 'Emas', value: byType('gold').sumQuantity || 0, type: 'gold' },
              { label: 'Saham', value: byType('saham').sumQuantity || 0, type: 'saham' },
              { label: 'Barang Berharga', value: byType('barang').sumQuantity || 0, type: 'barang' },
            ].map((item) => (
              <div key={item.type} className="bg-surface2 p-4 rounded-xl border border-line">
                <p className="text-inksoft text-xs mb-1">{item.label}</p>
                <p className="text-lg lg:text-xl font-bold text-ink">{formatQuantity(item.value, item.type)}</p>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* RECENT TRANSACTIONS + PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-base lg:text-lg font-bold text-ink mb-4">Transaksi Terbaru</h3>
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-line">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-inksoft">Tanggal</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-inksoft">Tipe</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-inksoft">Nama Aset</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-inksoft">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 text-sm text-inksoft">{new Date(tx.transactionDate).toLocaleDateString('id-ID')}</td>
                      <td className="px-3 py-3 text-sm">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-accentsoft text-accentink">
                          {tx.assetType === 'btc' ? 'BTC' : (tx.assetType?.charAt(0).toUpperCase() + tx.assetType?.slice(1))}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-ink font-medium">{tx.assetName}</td>
                      <td className="px-3 py-3 text-sm text-right font-semibold text-ink">Rp {tx.nominal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-inkfaint text-center py-8">Belum ada transaksi</p>
          )}
        </div>

        {/* PIE CHART */}
        <div className="card">
          <h3 className="text-base lg:text-lg font-bold text-ink mb-4">Distribusi Aset</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <defs>
                  {PIE_COLORS.map((c, i) => (
                    <linearGradient key={i} id={`dpie${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={shade(c, 0.3)} />
                      <stop offset="55%" stopColor={c} />
                      <stop offset="100%" stopColor={shade(c, -0.18)} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  dataKey="value"
                  data={(() => {
                    const byType = (t) => byAssetType.find(i => i._id === t) || { total: 0 }
                    const data = [
                      { name: 'Cash', value: Number(totalCash || 0) },
                      { name: 'Crypto', value: Number(byType('btc').total || 0) + Number(byType('crypto').total || 0) },
                      { name: 'Emas', value: Number(byType('gold').total || 0) },
                      { name: 'Saham', value: Number(byType('saham').total || 0) },
                      { name: 'Barang', value: Number(byType('barang').total || 0) },
                    ]
                    const sum = data.reduce((s, d) => s + d.value, 0) || 0
                    if (sum > 0) {
                      const perc = data.map(d => (d.value / sum) * 100)
                      const rounded = perc.map(p => Math.round(p))
                      const diff = 100 - rounded.reduce((s, v) => s + v, 0)
                      const fracs = perc.map((p, idx) => ({ idx, frac: p - Math.floor(p) }))
                      fracs.sort((a, b) => b.frac - a.frac)
                      const targetIdx = (fracs[0]?.idx ?? (data.length - 1))
                      rounded[targetIdx] = Math.max(0, rounded[targetIdx] + diff)
                      data.forEach((d, i) => { d.labelPercent = rounded[i] })
                    } else {
                      data.forEach(d => { d.labelPercent = 0 })
                    }
                    return data
                  })()}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={42}
                  label={({ payload }) => `${payload.labelPercent}%`}
                  labelLine={false}
                  stroke="var(--surface)"
                  strokeWidth={2}
                >
                  {PIE_COLORS.map((color, i) => <Cell key={color} fill={`url(#dpie${i})`} />)}
                </Pie>
                <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10 }} labelStyle={{ color: 'var(--ink)' }} itemStyle={{ color: 'var(--ink)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: 'var(--ink-soft)' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
