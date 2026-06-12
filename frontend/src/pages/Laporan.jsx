import { useEffect, useMemo, useState } from 'react'
import { cashFlowService } from '../services/api'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'

const formatCurrency = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const PIE_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#14B8A6', '#6B7280']

const monthKey = (d) => {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
const currentMonthKey = () => monthKey(new Date())

// Format singkat untuk sumbu Y grafik
const shortRp = (v) => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1)}jt`
  if (Math.abs(n) >= 1e3) return `${Math.round(n / 1e3)}rb`
  return `${n}`
}

function Laporan() {
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(currentMonthKey())

  useEffect(() => {
    cashFlowService.getAll()
      .then(res => setFlows(res.data?.data || []))
      .catch(() => setFlows([]))
      .finally(() => setLoading(false))
  }, [])

  // Tren 6 bulan terakhir (berakhir di bulan terpilih)
  const trend = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const base = new Date(y, m - 1, 1)
    const arr = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
      const key = monthKey(d)
      const inSum = flows.filter(f => f.type === 'income' && monthKey(f.date) === key).reduce((s, f) => s + (Number(f.amount) || 0), 0)
      const outSum = flows.filter(f => f.type === 'expense' && monthKey(f.date) === key).reduce((s, f) => s + (Number(f.amount) || 0), 0)
      arr.push({ label: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, Pemasukan: inSum, Pengeluaran: outSum })
    }
    return arr
  }, [flows, month])

  // Data bulan terpilih
  const monthFlows = useMemo(() => flows.filter(f => monthKey(f.date) === month), [flows, month])
  const totalIn = monthFlows.filter(f => f.type === 'income').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const totalOut = monthFlows.filter(f => f.type === 'expense').reduce((s, f) => s + (Number(f.amount) || 0), 0)
  const net = totalIn - totalOut

  // Breakdown pengeluaran per kategori (bulan terpilih)
  const expenseByCat = useMemo(() => {
    const map = {}
    monthFlows.filter(f => f.type === 'expense').forEach(f => {
      const c = f.category || 'Lainnya'
      map[c] = (map[c] || 0) + (Number(f.amount) || 0)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [monthFlows])

  const monthLabel = (() => {
    const [y, m] = month.split('-').map(Number)
    return `${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][m-1]} ${y}`
  })()

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Laporan</h1>
          <p className="text-xs lg:text-sm text-gray-600">Ringkasan arus kas: pemasukan vs pengeluaran per bulan</p>
        </div>
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Pilih Bulan</label>
          <input id="month" type="month" value={month} onChange={e => setMonth(e.target.value || currentMonthKey())} className="input-field" />
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-gray-600">Memuat laporan...</div>
      ) : (
        <>
          {/* SUMMARY bulan terpilih */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-sm text-gray-600">Pemasukan ({monthLabel})</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">{formatCurrency(totalIn)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Pengeluaran ({monthLabel})</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600">{formatCurrency(totalOut)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Selisih (Tabungan)</p>
              <p className={`text-xl lg:text-2xl font-bold ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{net < 0 ? '− ' : ''}{formatCurrency(Math.abs(net))}</p>
            </div>
          </div>

          {/* TREND 6 BULAN */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren 6 Bulan Terakhir</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={shortRp} tick={{ fontSize: 12 }} width={48} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BREAKDOWN PENGELUARAN */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran per Kategori — {monthLabel}</h3>
            {expenseByCat.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada pengeluaran di bulan ini</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={expenseByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                        {expenseByCat.map((entry, idx) => <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {expenseByCat.map((c, idx) => {
                    const pct = totalOut > 0 ? Math.round((c.value / totalOut) * 100) : 0
                    return (
                      <div key={c.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                          {c.name}
                        </span>
                        <span className="font-medium text-gray-900">{formatCurrency(c.value)} <span className="text-gray-400">({pct}%)</span></span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Laporan
