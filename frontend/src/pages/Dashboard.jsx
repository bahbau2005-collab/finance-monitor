import { useState, useEffect } from 'react'
import { transactionService, cashService, debtService } from '../services/api'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCash, setTotalCash] = useState(0)
  const [debtTotals, setDebtTotals] = useState({ hutang: 0, piutang: 0, hutangRemaining: 0, piutangRemaining: 0 })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [response, cashResp, debtsResp] = await Promise.all([
        transactionService.getDashboardSummary(),
        cashService.getAll(),
        debtService.getAll(),
      ])

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
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

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm lg:text-base text-gray-600">Ringkasan data keuangan Anda</p>
      </div>

      {/* TOTAL ASSETS CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="card">
          <p className="text-gray-600 text-xs lg:text-sm mb-2">Total Aset</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-blue-600">
            Rp {combinedTotalAssets.toLocaleString('id-ID')}
          </h2>
          <p className="text-gray-500 text-xs mt-2">Termasuk: Cash Rp {Number(totalCash).toLocaleString('id-ID')} + Piutang Belum Terbayar Rp {Number(debtTotals.piutangRemaining).toLocaleString('id-ID')}</p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Total Cash</p>
          <h2 className="text-3xl font-bold text-green-600">
            Rp {Number(totalCash).toLocaleString('id-ID')}
          </h2>
          <p className="text-gray-500 text-xs mt-2">Saldo semua rekening cash</p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Hutang Belum Terbayar</p>
          <h2 className="text-3xl font-bold text-red-600">
            Rp {Number(debtTotals.hutangRemaining).toLocaleString('id-ID')}
          </h2>
          <p className="text-gray-500 text-xs mt-2">Jumlah hutang yang masih harus dibayar</p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Piutang Belum Terbayar</p>
          <h2 className="text-3xl font-bold text-blue-600">
            Rp {Number(debtTotals.piutangRemaining).toLocaleString('id-ID')}
          </h2>
          <p className="text-gray-500 text-xs mt-2">Jumlah piutang yang belum tertagih</p>
        </div>

        {/* ASSET TYPE BREAKDOWN */}
        {byAssetType.length > 0 ? (
          byAssetType.map((item) => (
            <div key={item._id} className="card">
              <p className="text-gray-600 text-sm mb-2">
                {item._id === 'btc' ? 'BTC' : (item._id?.charAt(0).toUpperCase() + item._id?.slice(1))}
              </p>
              <h2 className="text-3xl font-bold text-green-600">
                Rp {item.total.toLocaleString('id-ID')}
              </h2>
              <p className="text-gray-500 text-xs mt-2">{item.count} transaksi</p>
            </div>
          ))
        ) : (
          <div className="card">
            <p className="text-gray-500 text-center">Belum ada data aset</p>
          </div>
        )}
      </div>

      {/* QUANTITY BREAKDOWN */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Total Jumlah Aset</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            const btcObj = byAssetType.find(i => i._id === 'btc') || {}
            const cryptoObj = byAssetType.find(i => i._id === 'crypto') || {}
            const goldObj = byAssetType.find(i => i._id === 'gold') || {}
            const sahamObj = byAssetType.find(i => i._id === 'saham') || {}
            const barangObj = byAssetType.find(i => i._id === 'barang') || {}
            return [
              { label: 'BITCOIN (BTC)', value: btcObj.sumQuantity || 0, type: 'btc' },
              { label: 'Emas (gram)', value: goldObj.sumQuantity || 0, type: 'gold' },
              { label: 'Saham', value: sahamObj.sumQuantity || 0, type: 'saham' },
              { label: 'Barang Berharga', value: barangObj.sumQuantity || 0, type: 'barang' },
            ].map((item) => (
              <div key={item.type} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <p className="text-gray-700 font-medium text-sm mb-1">{item.label}</p>
                <p className="text-2xl font-bold text-blue-600">{formatQuantity(item.value, item.type)}</p>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Transaksi Terbaru</h3>
        
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipe Aset</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Aset</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(tx.transactionDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {tx.assetType === 'btc' ? 'BTC' : (tx.assetType?.charAt(0).toUpperCase() + tx.assetType?.slice(1))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{tx.assetName}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      Rp {tx.nominal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Belum ada transaksi</p>
        )}
        </div>

        {/* PIE CHART: ASSET DISTRIBUTION */}
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Distribusi Aset</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={(() => {
                    const btcObj = byAssetType.find(i => i._id === 'btc') || { total: 0 }
                    const cryptoObj = byAssetType.find(i => i._id === 'crypto') || { total: 0 }
                    const goldObj = byAssetType.find(i => i._id === 'gold') || { total: 0 }
                    const sahamObj = byAssetType.find(i => i._id === 'saham') || { total: 0 }
                    const barangObj = byAssetType.find(i => i._id === 'barang') || { total: 0 }
                    const btcTotal = Number(btcObj.total || 0)
                    const cryptoTotal = Number(cryptoObj.total || 0)
                    const goldTotal = Number(goldObj.total || 0)
                    const sahamTotal = Number(sahamObj.total || 0)
                    const barangTotal = Number(barangObj.total || 0)
                    const cashTotal = Number(totalCash || 0)
                    const data = [
                      { name: 'Cash', value: cashTotal },
                      { name: 'Crypto', value: btcTotal + cryptoTotal },
                      { name: 'Gold', value: goldTotal },
                      { name: 'Saham', value: sahamTotal },
                      { name: 'Barang', value: barangTotal },
                    ]
                    const sum = data.reduce((s, d) => s + d.value, 0) || 0
                    if (sum > 0) {
                      const perc = data.map(d => (d.value / sum) * 100)
                      const rounded = perc.map(p => Math.round(p))
                      const diff = 100 - rounded.reduce((s, v) => s + v, 0)
                      // adjust the largest fractional part to fix rounding sum
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
                  innerRadius={36}
                  label={({ payload }) => `${payload.labelPercent}%`}
                  labelLine={false}
                >
                  {['#10B981', '#2563EB', '#C084FC', '#F59E0B', '#EC4899'].map((color, idx) => (
                    <Cell key={color} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
