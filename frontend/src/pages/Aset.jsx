import { useEffect, useState } from 'react'
import { transactionService } from '../services/api'
import * as XLSX from 'xlsx'

function Aset() {
  // INPUT STATE
  const [formData, setFormData] = useState({
    assetType: 'btc',
    assetName: '',
    nominal: '',
    quantity: '',
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [inputError, setInputError] = useState(null)
  const [inputSuccess, setInputSuccess] = useState(false)

  // REPORT STATE
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ assetType: '', startDate: '', endDate: '' })
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState(null)

  useEffect(() => { fetchTransactions() }, [filters])

  // Handlers: Input
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setInputError(null)
    setInputSuccess(false)
    try {
      if (!formData.assetName.trim()) {
        setInputError('Nama aset tidak boleh kosong')
        setSaving(false)
        return
      }
      if (!formData.nominal || Number(formData.nominal) <= 0) {
        setInputError('Nominal harus lebih besar dari 0')
        setSaving(false)
        return
      }
      if (['btc','crypto','gold','saham'].includes(formData.assetType)) {
        if (!formData.quantity || Number(formData.quantity) <= 0) {
          setInputError('Jumlah harus diisi (>0) untuk tipe aset ini')
          setSaving(false)
          return
        }
      }
      await transactionService.create({
        ...formData,
        nominal: Number.parseInt(formData.nominal, 10),
        quantity: formData.quantity ? Number.parseFloat(formData.quantity) : 0,
      })
      setInputSuccess(true)
      setFormData({ assetType: 'btc', assetName: '', nominal: '', quantity: '', transactionDate: new Date().toISOString().split('T')[0], description: '' })
      setTimeout(() => setInputSuccess(false), 2000)
      fetchTransactions()
    } catch (err) {
      setInputError(err?.response?.data?.message || 'Gagal menyimpan transaksi')
    } finally {
      setSaving(false)
    }
  }

  // Handlers: Report
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.assetType) params.assetType = filters.assetType
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      const res = await transactionService.getAll(params)
      setTransactions(res.data?.data || [])
      setError(null)
    } catch (err) {
      console.error('Fetch transaksi gagal:', err)
      setError('Gagal mengambil data transaksi')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleDelete = async (id) => {
    if (!globalThis.confirm('Yakin ingin menghapus transaksi ini?')) return
    try {
      await transactionService.delete(id)
      setTransactions(prev => prev.filter(t => t._id !== id))
    } catch {
      alert('Gagal menghapus transaksi')
    }
  }

  const handleSelectRow = (id) => {
    const s = new Set(selectedIds)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelectedIds(s)
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(new Set(transactions.map(tx => tx._id)))
    else setSelectedIds(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) { alert('Pilih setidaknya satu transaksi'); return }
    if (!globalThis.confirm(`Hapus ${selectedIds.size} transaksi?`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => transactionService.delete(id)))
      setSelectedIds(new Set())
      fetchTransactions()
    } catch {
      alert('Gagal menghapus beberapa transaksi')
    }
  }

  // Import/Export
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Template kosong untuk diisi user
    const templateData = [
      { 'Tanggal': '', 'Tipe Aset': '', 'Nama Aset': '', 'Jumlah': '', 'Nominal (Rp)': '', 'Deskripsi': '' }
    ]
    const wsTemplate = XLSX.utils.json_to_sheet(templateData)
    wsTemplate['!cols'] = [ { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 25 } ]
    
    // Sheet 2: Contoh pengisian
    const exampleData = [
      { 'Tanggal': '28/12/2025', 'Tipe Aset': 'btc', 'Nama Aset': 'Bitcoin', 'Jumlah': '0.5', 'Nominal (Rp)': '500000000', 'Deskripsi': 'Pembelian BTC' },
      { 'Tanggal': '28/12/2025', 'Tipe Aset': 'gold', 'Nama Aset': 'Emas Antam', 'Jumlah': '10', 'Nominal (Rp)': '12000000', 'Deskripsi': 'Investasi emas 10 gram' },
      { 'Tanggal': '28/12/2025', 'Tipe Aset': 'saham', 'Nama Aset': 'BBCA', 'Jumlah': '100', 'Nominal (Rp)': '1000000', 'Deskripsi': '100 lembar saham BCA' },
      { 'Tanggal': '28/12/2025', 'Tipe Aset': 'crypto', 'Nama Aset': 'Ethereum', 'Jumlah': '2', 'Nominal (Rp)': '80000000', 'Deskripsi': 'Pembelian ETH' }
    ]
    const wsExample = XLSX.utils.json_to_sheet(exampleData)
    wsExample['!cols'] = [ { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 25 } ]
    
    // Sheet 3: Panduan
    const guideData = [
      { 'Kolom': 'Tanggal', 'Format': 'DD/MM/YYYY atau YYYY-MM-DD', 'Contoh': '28/12/2025', 'Wajib': 'Ya' },
      { 'Kolom': 'Tipe Aset', 'Format': 'btc / crypto / gold / saham', 'Contoh': 'btc', 'Wajib': 'Ya' },
      { 'Kolom': 'Nama Aset', 'Format': 'Teks bebas', 'Contoh': 'Bitcoin', 'Wajib': 'Ya' },
      { 'Kolom': 'Jumlah', 'Format': 'Angka desimal', 'Contoh': '0.5 (untuk BTC), 10 (untuk gold)', 'Wajib': 'Ya (untuk btc/crypto/gold/saham)' },
      { 'Kolom': 'Nominal (Rp)', 'Format': 'Angka tanpa pemisah ribuan', 'Contoh': '500000000', 'Wajib': 'Ya' },
      { 'Kolom': 'Deskripsi', 'Format': 'Teks bebas', 'Contoh': 'Pembelian BTC', 'Wajib': 'Tidak' }
    ]
    const wsGuide = XLSX.utils.json_to_sheet(guideData)
    wsGuide['!cols'] = [ { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 } ]
    
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template')
    XLSX.utils.book_append_sheet(wb, wsExample, 'Contoh')
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan')
    XLSX.writeFile(wb, 'Template-Import-Aset.xlsx')
  }

  const handleExportExcel = () => {
    if (transactions.length === 0) { alert('Tidak ada data untuk diekspor'); return }
    const data = transactions.map(tx => ({
      'Tanggal': new Date(tx.transactionDate).toLocaleDateString('id-ID'),
      'Tipe Aset': tx.assetType === 'btc' ? 'BTC' : (tx.assetType?.charAt(0).toUpperCase() + tx.assetType?.slice(1)),
      'Nama Aset': tx.assetName,
      'Jumlah': tx.quantity || '',
      'Nominal (Rp)': tx.nominal,
      'Deskripsi': tx.description || '-',
    }))
    const totalNominal = transactions.reduce((sum, tx) => sum + tx.nominal, 0)
    const totalQuantity = transactions.reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [ { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 25 } ]
    const wsSummary = XLSX.utils.json_to_sheet([
      {},
      { 'Tanggal': 'RINGKASAN' },
      { 'Tanggal': 'Total Transaksi', 'Tipe Aset': transactions.length },
      { 'Tanggal': 'Total Jumlah (unit)', 'Jumlah': totalQuantity },
      { 'Tanggal': 'Total Nominal', 'Nominal (Rp)': totalNominal },
    ])
    wsSummary['!cols'] = [ { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 25 } ]
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')
    XLSX.writeFile(wb, `Laporan-Aset-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      if (!rows || rows.length === 0) { alert('File kosong atau format tidak dikenali'); return }
      const transactionsToImport = rows.map(r => {
        const tanggal = r.Tanggal || r.Date || r.tanggal
        const tipe = r['Tipe Aset'] || r.tipe || r.assetType
        const nama = r['Nama Aset'] || r.nama || r.assetName
        const nominalRaw = r['Nominal (Rp)'] || r.Nominal || r.nominal
        const desc = r['Deskripsi'] || r.deskripsi || r.description || ''
        const qtyRaw = r['Jumlah'] || r.Quantity || r.quantity || ''
        const nominal = Number.parseFloat(String(nominalRaw).replace(/[^0-9.-]/g, '')) || 0
        let transactionDate = null
        if (typeof tanggal === 'number') {
          const d = XLSX.SSF.parse_date_code(tanggal)
          if (d) transactionDate = new Date(d.y, d.m - 1, d.d).toISOString()
        } else if (tanggal) {
          const parsed = new Date(tanggal)
          if (!Number.isNaN(parsed)) transactionDate = parsed.toISOString()
        }
        const quantity = Number.parseFloat(String(qtyRaw).replace(/[^0-9.-]/g, '')) || 0
        return {
          assetType: String(tipe || '').toLowerCase(),
          assetName: String(nama || '').trim(),
          nominal,
          quantity: quantity || undefined,
          transactionDate: transactionDate || new Date().toISOString(),
          description: String(desc || '').trim(),
        }
      })
      if (!globalThis.confirm(`Import ${transactionsToImport.length} transaksi? Lanjutkan?`)) { return }
      const payload = { transactions: transactionsToImport }
      const res = await transactionService.importTransactions(payload)
      alert(`Import selesai: ${res.data?.importedCount || transactionsToImport.length} transaksi`)
      fetchTransactions()
    } catch (err) {
      console.error('Import file gagal:', err)
      alert('Gagal mengimport file. Periksa format dan coba lagi.')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0]
    if (file) handleFileUpload(file)
    if (e.target) e.target.value = null
  }

  // Quantity summary & formatters
  const btcQty = transactions.filter(tx => tx.assetType === 'btc').reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
  const goldQty = transactions.filter(tx => tx.assetType === 'gold').reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
  const sahamQty = transactions.filter(tx => tx.assetType === 'saham').reduce((s, tx) => s + (Number(tx.quantity) || 0), 0)
  const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`
  const formatQuantityTx = (tx) => {
    const q = tx && (tx.quantity || tx.quantity === 0) ? Number(tx.quantity) : null
    if (q === null || Number.isNaN(q) || q === 0) return '-'
    if (tx.assetType === 'btc' || tx.assetType === 'crypto') return `${q.toFixed(8)}`
    if (tx.assetType === 'gold') return `${q.toFixed(4)} g`
    if (tx.assetType === 'saham') return `${q.toFixed(0)} lembar`
    return `${q}`
  }

  // Edit modal
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeEdit = () => { setEditingId(null); setEditData(null) }

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
      setTransactions(prev => prev.map(t => (t._id === editingId ? res.data?.data : t)))
      closeEdit()
    } catch {
      alert('Gagal mengupdate transaksi')
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Aset</h1>
        <p className="text-xs lg:text-sm text-gray-600">Input di atas, Laporan di bawah</p>
      </div>

      {/* INPUT SECTION */}
      <div className="card">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Tambah Transaksi Aset</h3>
        {inputSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700">✓ Transaksi berhasil disimpan!</p>
          </div>
        )}
        {inputError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">✗ {inputError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">Jenis Aset</label>
              <select id="assetType" name="assetType" value={formData.assetType} onChange={handleInputChange} className="input-field">
                <option value="btc">Bitcoin (BTC)</option>
                <option value="crypto">Cryptocurrency (Other)</option>
                <option value="saham">Saham</option>
                <option value="gold">Emas / Logam Mulia</option>
              </select>
            </div>
            <div>
              <label htmlFor="assetName" className="block text-sm font-medium text-gray-700 mb-2">Nama Aset</label>
              <input id="assetName" type="text" name="assetName" value={formData.assetName} onChange={handleInputChange} className="input-field" placeholder="Contoh: Bitcoin, Emas Antam" />
            </div>
            <div>
              <label htmlFor="nominal" className="block text-sm font-medium text-gray-700 mb-2">Nominal Transaksi (Rp)</label>
              <input id="nominal" type="number" name="nominal" value={formData.nominal} onChange={handleInputChange} className="input-field" placeholder="5000000" min="0" />
            </div>
            <div>
              <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-2">Tanggal Transaksi</label>
              <input id="transactionDate" type="date" name="transactionDate" value={formData.transactionDate} onChange={handleInputChange} className="input-field" />
            </div>
            {['btc','crypto','gold','saham'].includes(formData.assetType) && (
              <div>
                {(() => {
                  const unit = (formData.assetType === 'btc' || formData.assetType === 'crypto') ? 'koin' : (formData.assetType === 'gold' ? 'gram' : 'lembar')
                  const ph = (formData.assetType === 'btc' || formData.assetType === 'crypto') ? '0.025' : (formData.assetType === 'gold' ? '1.5 (gram)' : '10 (lembar)')
                  return (
                    <>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">Jumlah ({unit})</label>
                      <input id="quantity" type="number" step="any" name="quantity" value={formData.quantity} onChange={handleInputChange} className="input-field" placeholder={ph} />
                    </>
                  )
                })()}
              </div>
            )}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Keterangan (Opsional)</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="3" className="input-field" placeholder="Catatan transaksi" />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Transaksi'}</button>
              <button type="reset" className="btn btn-secondary" onClick={() => setFormData({ assetType: 'btc', assetName: '', nominal: '', quantity: '', transactionDate: new Date().toISOString().split('T')[0], description: '' })}>Reset</button>
            </div>
          </form>
        </div>

      {/* FILTERS & ACTIONS */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Filter & Cari</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="filterAssetType" className="block text-sm font-medium text-gray-700 mb-2">Tipe Aset</label>
            <select id="filterAssetType" name="assetType" value={filters.assetType} onChange={handleFilterChange} className="input-field">
              <option value="">Semua Tipe</option>
              <option value="btc">BITCOIN (BTC)</option>
              <option value="crypto">Cryptocurrency (Other)</option>
              <option value="saham">Saham</option>
              <option value="gold">Emas / Logam Mulia</option>
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
            <input id="startDate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-field" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
            <input id="endDate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-field" />
          </div>
          <div className="flex items-end"><button onClick={() => setFilters({ assetType: '', startDate: '', endDate: '' })} className="btn btn-secondary w-full">Reset Filter</button></div>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <div>{selectedIds.size > 0 && (<button onClick={handleBulkDelete} className="btn bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Hapus {selectedIds.size} Item</button>)}</div>
        <div className="flex gap-2 items-center">
          <button onClick={handleDownloadTemplate} className="btn btn-outline flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Template Excel</button>
          <label className="flex items-center gap-2 cursor-pointer"><input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" /><span className="btn btn-secondary flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Import Excel</span></label>
          <button onClick={handleExportExcel} className="btn btn-primary flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export Excel</button>
        </div>
      </div>

      {/* REPORT TABLE */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Belum ada transaksi</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" className="w-4 h-4" checked={transactions.length>0 && selectedIds.size===transactions.length} onChange={handleSelectAll} /></th>
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
                  <td className="px-4 py-3 text-left"><input type="checkbox" className="w-4 h-4" checked={selectedIds.has(tx._id)} onChange={() => handleSelectRow(tx._id)} /></td>
                  <td className="px-4 py-3 text-sm">{new Date(tx.transactionDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm"><span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium" style={{textTransform: tx.assetType === 'btc' ? 'uppercase' : 'capitalize'}}>{tx.assetType === 'btc' ? 'BTC' : tx.assetType}</span></td>
                  <td className="px-4 py-3 text-sm font-medium">{tx.assetName}</td>
                  <td className="px-4 py-3 text-sm text-center">{formatQuantityTx(tx)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">Rp {tx.nominal.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{tx.description || '-'}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => openEdit(tx)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                    <button onClick={() => handleDelete(tx._id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingId && editData && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div role="button" tabIndex={0} className="fixed inset-0 bg-black opacity-40" style={{zIndex:50}} onClick={closeEdit} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') closeEdit() }}></div>
          <div role="dialog" aria-modal="true" className="relative bg-white rounded-lg shadow-lg p-6 z-60 w-full max-w-xl mx-4" style={{zIndex:60}} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit Transaksi</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editAssetType" className="block text-sm font-medium text-gray-700 mb-1">Tipe Aset</label>
                  <select id="editAssetType" name="assetType" value={editData.assetType} onChange={handleEditChange} className="input-field">
                    <option value="btc">BITCOIN (BTC)</option>
                    <option value="crypto">Cryptocurrency (Other)</option>
                    <option value="saham">Saham</option>
                    <option value="gold">Emas / Logam Mulia</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editAssetName" className="block text-sm font-medium text-gray-700 mb-1">Nama Aset</label>
                  <input id="editAssetName" name="assetName" value={editData.assetName} onChange={handleEditChange} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editNominal" className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                  <input id="editNominal" name="nominal" type="number" value={editData.nominal} onChange={handleEditChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="editDate" className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input id="editDate" name="transactionDate" type="date" value={editData.transactionDate} onChange={handleEditChange} className="input-field" />
                </div>
              </div>
              {['btc','crypto','gold','saham'].includes(editData.assetType) && (
                <div>
                  <label htmlFor="editQuantity" className="block text-sm font-medium text-gray-700 mb-1">Jumlah (koin/gram/lembar)</label>
                  <input id="editQuantity" name="quantity" type="number" step="any" value={editData.quantity} onChange={handleEditChange} className="input-field" />
                </div>
              )}
              <div>
                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea id="editDescription" name="description" value={editData.description} onChange={handleEditChange} className="input-field" rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeEdit} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close table card before showing summaries */}

      {transactions.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-gray-600 text-sm">Total Transaksi</p>
              <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-600 text-sm">Total Nominal</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(transactions.reduce((s, tx) => s + tx.nominal, 0))}</p>
            </div>
            <div className="card text-center">
              <p className="text-gray-600 text-sm">Rata-rata Nominal</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(Math.round(transactions.reduce((s, tx) => s + tx.nominal, 0) / transactions.length))}</p>
            </div>
          </div>

          {/* Total Quantity by Asset Type */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Total Jumlah Aset</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ label: 'BITCOIN (BTC)', qty: btcQty, unit: 'BTC', format: (q) => q.toFixed(8) }, { label: 'Emas (gram)', qty: goldQty, unit: 'g', format: (q) => q.toFixed(4) }, { label: 'Saham (lembar)', qty: sahamQty, unit: 'lembar', format: (q) => q.toFixed(0) }].map(item => (
                <div key={item.label} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <p className="text-gray-700 font-medium text-sm mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-blue-600">{item.qty > 0 ? `${item.format(item.qty)} ${item.unit}` : '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Aset
