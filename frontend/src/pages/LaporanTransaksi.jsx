import { useState, useEffect } from 'react'
import { transactionService } from '../services/api'
import * as XLSX from 'xlsx'

function LaporanTransaksi() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter state
  const [filters, setFilters] = useState({
    assetType: '',
    startDate: '',
    endDate: '',
  })

  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState(null)
  const [importLoading, setImportLoading] = useState(false)

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set())

  const formatQuantity = (tx) => {
    const q = tx && (tx.quantity || tx.quantity === 0) ? Number(tx.quantity) : null
    if (q === null || q === undefined || isNaN(q) || q === 0) return '-'
    if (tx.assetType === 'btc' || tx.assetType === 'crypto') return q.toFixed(8)
    if (tx.assetType === 'gold') return `${q.toFixed(4)} g`
    if (tx.assetType === 'saham') return `${q} lembar`
    return q
  }

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const filterParams = {}
      if (filters.assetType) filterParams.assetType = filters.assetType
      if (filters.startDate) filterParams.startDate = filters.startDate
      if (filters.endDate) filterParams.endDate = filters.endDate

      const response = await transactionService.getAll(filterParams)
      setTransactions(response.data.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Gagal mengambil data transaksi')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return

    try {
      await transactionService.delete(id)
      setTransactions(prev => prev.filter(t => t._id !== id))
      alert('Transaksi berhasil dihapus')
    } catch (err) {
      alert('Gagal menghapus transaksi')
    }
  }

  // --- EDIT / UPDATE HANDLERS ---
  const openEdit = (tx) => {
    setEditingId(tx._id)
    setEditData({
      assetType: tx.assetType,
      assetName: tx.assetName,
      nominal: tx.nominal,
      quantity: tx.quantity || '',
      transactionDate: new Date(tx.transactionDate).toISOString().split('T')[0],
      description: tx.description || '',
    })
    // scroll to top so modal is visible on small screens
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEdit = () => {
    setEditingId(null)
    setEditData(null)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!editData) return

    const payload = {
      assetType: editData.assetType,
      assetName: editData.assetName,
      nominal: Number(editData.nominal),
      quantity: editData.quantity ? Number(editData.quantity) : undefined,
      transactionDate: editData.transactionDate,
      description: editData.description,
    }

    try {
      const res = await transactionService.update(editingId, payload)
      // update local state
      setTransactions(prev => prev.map(t => (t._id === editingId ? res.data.data : t)))
      alert('Transaksi berhasil diupdate')
      closeEdit()
    } catch (err) {
      console.error('Gagal update transaksi:', err)
      alert('Gagal mengupdate transaksi')
    }
  }

  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    // Prepare data for Excel
    const data = transactions.map(tx => ({
      'Tanggal': new Date(tx.transactionDate).toLocaleDateString('id-ID'),
      'Tipe Aset': tx.assetType.charAt(0).toUpperCase() + tx.assetType.slice(1),
      'Nama Aset': tx.assetName,
      'Jumlah': tx.quantity || '',
      'Nominal (Rp)': tx.nominal,
      'Deskripsi': tx.description || '-'
    }))

    // Add summary rows
    const totalNominal = transactions.reduce((sum, tx) => sum + tx.nominal, 0)
    const averageNominal = Math.round(totalNominal / transactions.length)

    const totalQuantity = transactions.reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
    const summaryData = [
      {},
      { 'Tanggal': 'RINGKASAN', 'Tipe Aset': '', 'Nama Aset': '', 'Jumlah': '', 'Nominal (Rp)': '', 'Deskripsi': '' },
      { 'Tanggal': 'Total Transaksi', 'Tipe Aset': transactions.length, 'Nama Aset': '', 'Jumlah': '', 'Nominal (Rp)': '', 'Deskripsi': '' },
      { 'Tanggal': 'Total Jumlah (unit)', 'Tipe Aset': '', 'Nama Aset': '', 'Jumlah': totalQuantity, 'Nominal (Rp)': '', 'Deskripsi': '' },
      { 'Tanggal': 'Total Nominal', 'Tipe Aset': '', 'Nama Aset': '', 'Jumlah': '', 'Nominal (Rp)': totalNominal, 'Deskripsi': '' },
      { 'Tanggal': 'Rata-rata Nominal', 'Tipe Aset': '', 'Nama Aset': '', 'Jumlah': '', 'Nominal (Rp)': averageNominal, 'Deskripsi': '' }
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Create main data sheet
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 },  // Tanggal
      { wch: 15 },  // Tipe Aset
      { wch: 20 },  // Nama Aset
      { wch: 12 },  // Jumlah
      { wch: 18 },  // Nominal
      { wch: 25 }   // Deskripsi
    ]

    // Add summary sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    wsSummary['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 25 }
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

    // Generate filename with current date
    const filename = `Laporan-Keuangan-${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Download file
    XLSX.writeFile(wb, filename)
  }

  // --- IMPORT EXCEL ---
  const handleFileUpload = async (file) => {
    if (!file) return
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream'
    ]
    // proceed anyway; XLSX can often parse
    try {
      setImportLoading(true)
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })

      if (!rows || rows.length === 0) {
        alert('File kosong atau format tidak dikenali')
        setImportLoading(false)
        return
      }

      // Map rows to transaction payloads. Expect headers: Tanggal, Tipe Aset, Nama Aset, Nominal (Rp), Deskripsi
      const transactionsToImport = rows.map(r => {
        // Normalize keys (handle different header names)
        const tanggal = r.Tanggal || r.Tanggal_ || r.Date || r.tanggal || r.date
        const tipe = r['Tipe Aset'] || r.Tipe || r['Tipe'] || r.tipe || r.assetType
        const nama = r['Nama Aset'] || r['Nama'] || r.nama || r.assetName
        const nominalRaw = r['Nominal (Rp)'] || r.Nominal || r.nominal || r.Amount || r.amount
        const desc = r['Deskripsi'] || r.Deskription || r.deskripsi || r.description || ''
        const qtyRaw = r['Jumlah'] || r.Quantity || r['Jumlah (unit)'] || r.quantity || r.Qty || ''

        // Try parse nominal
        const nominal = Number(String(nominalRaw).replace(/[^0-9.-]/g, '')) || 0

        // Parse date (accept Excel serial or ISO)
        let transactionDate = null
        if (typeof tanggal === 'number') {
          // Excel serial date
          const d = XLSX.SSF.parse_date_code(tanggal)
          if (d) transactionDate = new Date(d.y, d.m - 1, d.d).toISOString()
        } else if (tanggal) {
          const parsed = new Date(tanggal)
          if (!isNaN(parsed)) transactionDate = parsed.toISOString()
        }

        const quantity = Number(String(qtyRaw).replace(/[^0-9.-]/g, '')) || 0

        return {
          assetType: String(tipe || '').toLowerCase(),
          assetName: String(nama || '').trim(),
          nominal,
          quantity: quantity || undefined,
          transactionDate: transactionDate || new Date().toISOString(),
          description: String(desc || '').trim(),
        }
      })

      // Ask confirmation
      if (!window.confirm(`Import ${transactionsToImport.length} transaksi? Lanjutkan?`)) {
        setImportLoading(false)
        return
      }

      // Send to backend
      const payload = { transactions: transactionsToImport }
      const res = await transactionService.importTransactions(payload)
      alert(`Import selesai: ${res.data.importedCount} transaksi`) 
      // Refresh list
      fetchTransactions()
    } catch (err) {
      console.error('Gagal import file:', err)
      alert('Gagal mengimport file. Periksa format dan coba lagi.')
    } finally {
      setImportLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) handleFileUpload(file)
    // clear input
    e.target.value = null
  }

  // --- DOWNLOAD TEMPLATE ---
  const downloadTemplate = () => {
    const templateRows = [
      {
        'Tanggal': '2025-12-27',
        'Tipe Aset': 'btc',
        'Nama Aset': 'Bitcoin',
        'Jumlah': 0.01234567,
        'Nominal (Rp)': 1000000,
        'Deskripsi': 'Contoh transaksi bitcoin',
        '': ''
      },
      {
        'Tanggal': '2025-12-25',
        'Tipe Aset': 'crypto',
        'Nama Aset': 'Ethereum',
        'Jumlah': 0.5,
        'Nominal (Rp)': 500000,
        'Deskripsi': 'Contoh transaksi cryptocurrency lain',
        '': ''
      },
      {
        'Tanggal': '2025-12-24',
        'Tipe Aset': 'gold',
        'Nama Aset': 'Emas Antam',
        'Jumlah': 1.5,
        'Nominal (Rp)': 2000000,
        'Deskripsi': 'Contoh transaksi emas logam mulia',
        '': ''
      },
      {
        'Tanggal': '2025-12-23',
        'Tipe Aset': 'saham',
        'Nama Aset': 'ASII',
        'Jumlah': 10,
        'Nominal (Rp)': 1500000,
        'Deskripsi': 'Contoh transaksi saham',
        '': ''
      },
      {},
      { 'Tanggal': '', 'Tipe Aset': '', 'Nama Aset': '', 'Jumlah': '', 'Nominal (Rp)': '', 'Deskripsi': '', '': '', 'Tipe Aset Tersedia': 'btc, crypto, gold, saham' }
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(templateRows, { header: ['Tanggal','Tipe Aset','Nama Aset','Jumlah','Nominal (Rp)','Deskripsi','','Tipe Aset Tersedia'] })
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 30 }, { wch: 3 }, { wch: 22 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Template-Import-Transaksi.xlsx')
  }

  // --- CHECKBOX & BULK DELETE ---
  const handleSelectRow = (id) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(transactions.map(tx => tx._id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('Pilih setidaknya satu transaksi')
      return
    }

    if (!window.confirm(`Hapus ${selectedIds.size} transaksi? Tidak bisa dibatalkan.`)) return

    try {
      const promises = Array.from(selectedIds).map(id => transactionService.delete(id))
      await Promise.all(promises)
      alert(`${selectedIds.size} transaksi berhasil dihapus`)
      setSelectedIds(new Set())
      fetchTransactions()
    } catch (err) {
      console.error('Gagal hapus transaksi:', err)
      alert('Gagal menghapus beberapa transaksi')
    }
  }

  return (
    <div className="space-y-8">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Laporan Transaksi</h1>
        <p className="text-gray-600">Lihat semua riwayat transaksi aset Anda</p>
      </div>

      {/* FILTER SECTION */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filter & Cari</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Asset Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Aset</label>
            <select
              name="assetType"
              value={filters.assetType}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">Semua Tipe</option>
              <option value="btc">BITCOIN (BTC)</option>
              <option value="crypto">Cryptocurrency (Other)</option>
              <option value="saham">Saham</option>
              <option value="gold">Emas / Logam Mulia</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="input-field"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="input-field"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => setFilters({ assetType: '', startDate: '', endDate: '' })}
              className="btn btn-secondary flex-1"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-between items-center gap-2">
        <div>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn bg-red-500 text-white hover:bg-red-600 hover:shadow-lg"
            >
              🗑️ Hapus {selectedIds.size} Item
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <span className="btn btn-secondary flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Import Excel</span>
          </label>

          <button onClick={downloadTemplate} className="btn btn-outline flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Download Template</button>
          <button
            onClick={handleExportExcel}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export Excel
          </button>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Belum ada transaksi</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={transactions.length > 0 && selectedIds.size === transactions.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipe Aset</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Aset</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Jumlah</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Nominal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Deskripsi</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id} className={`border-b border-gray-200 hover:bg-gray-50 ${selectedIds.has(tx._id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tx._id)}
                      onChange={() => handleSelectRow(tx._id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(tx.transactionDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium" style={{textTransform: tx.assetType === 'btc' ? 'uppercase' : 'capitalize'}}>
                      {tx.assetType === 'btc' ? 'BTC' : tx.assetType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{tx.assetName}</td>
                  <td className="px-4 py-3 text-sm text-center">{formatQuantity(tx)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                    Rp {tx.nominal.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {tx.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => openEdit(tx)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tx._id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingId && editData && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          {/* Backdrop, only closes modal if click outside modal */}
          <div className="fixed inset-0 bg-black opacity-40" style={{zIndex: 50}} onClick={closeEdit}></div>
          {/* Modal, must be above backdrop and not close on click inside */}
          <div className="relative bg-white rounded-lg shadow-lg p-6 z-60 w-full max-w-xl mx-4" style={{zIndex: 60}} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit Transaksi</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Aset</label>
                  <select name="assetType" value={editData.assetType} onChange={handleEditChange} className="input-field">
                    <option value="btc">BITCOIN (BTC)</option>
                    <option value="crypto">Cryptocurrency (Other)</option>
                    <option value="saham">Saham</option>
                    <option value="gold">Emas / Logam Mulia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aset</label>
                  <input name="assetName" value={editData.assetName} onChange={handleEditChange} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                  <input name="nominal" type="number" value={editData.nominal} onChange={handleEditChange} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input name="transactionDate" type="date" value={editData.transactionDate} onChange={handleEditChange} className="input-field" />
                </div>
              </div>

              {['btc','crypto','gold','saham'].includes(editData.assetType) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (koin/gram/lembar)</label>
                  <input name="quantity" type="number" step="any" value={editData.quantity} onChange={handleEditChange} className="input-field" />
                  <p className="text-xs text-gray-500 mt-1">Isi jumlah untuk aset berbasis unit (mis. BTC, gram emas, lembar saham).</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea name="description" value={editData.description} onChange={handleEditChange} className="input-field" rows={3}></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeEdit} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUMMARY */}
        {transactions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <p className="text-gray-600 text-sm">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Nominal</p>
                <p className="text-2xl font-bold text-green-600">
                  Rp {transactions.reduce((sum, tx) => sum + tx.nominal, 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Rata-rata Nominal</p>
                <p className="text-2xl font-bold text-purple-600">
                  Rp {Math.round(transactions.reduce((sum, tx) => sum + tx.nominal, 0) / transactions.length).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* QUANTITY SUMMARY */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Total Jumlah Aset</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const btcQty = transactions.filter(tx => tx.assetType === 'btc').reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
                  const cryptoQty = transactions.filter(tx => tx.assetType === 'crypto').reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
                  const goldQty = transactions.filter(tx => tx.assetType === 'gold').reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
                  const sahamQty = transactions.filter(tx => tx.assetType === 'saham').reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
                  return [
                    { label: 'BITCOIN (BTC)', qty: btcQty, unit: 'BTC', format: (q) => q.toFixed(8) },
                    { label: 'Emas (gram)', qty: goldQty, unit: 'g', format: (q) => q.toFixed(4) },
                    { label: 'Saham (lembar)', qty: sahamQty, unit: 'lembar', format: (q) => q.toFixed(0) },
                  ].map((item) => (
                    <div key={item.label} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-700 font-medium text-sm mb-1">{item.label}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {item.qty > 0 ? `${item.format(item.qty)} ${item.unit}` : '-'}
                      </p>
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LaporanTransaksi
