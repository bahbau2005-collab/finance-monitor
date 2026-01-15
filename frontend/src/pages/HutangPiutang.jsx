import { useEffect, useState, useRef } from 'react'
import { debtService } from '../services/api'
import * as XLSX from 'xlsx'
import imageCompression from 'browser-image-compression'

function HutangPiutang() {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    type: 'hutang',
    personName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'onprogress',
    photoUrl: '',
  })

  const [editingId, setEditingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [paymentForId, setPaymentForId] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [viewPhotoUrl, setViewPhotoUrl] = useState(null)
  const fileInputRef = useRef(null)

  const clearPhoto = () => {
    setForm(prev => ({ ...prev, photoUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    fetchDebts()
  }, [])

  const fetchDebts = async () => {
    try {
      setLoading(true)
      const res = await debtService.getAll()
      setDebts(res.data.data || [])
      setError(null)
    } catch (err) {
      setError('Gagal mengambil data hutang/piutang')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = async (e) => {
    const { name, value, files } = e.target
    if (name === 'photo' && files && files[0]) {
      const file = files[0]
      try {
        // Kompresi foto untuk hemat storage
        const options = {
          maxSizeMB: 0.5,           // Maksimal 500KB
          maxWidthOrHeight: 1024,   // Maksimal resolusi 1024px
          useWebWorker: true,
          fileType: 'image/jpeg'    // Convert ke JPEG untuk ukuran lebih kecil
        }
        const compressedFile = await imageCompression(file, options)
        
        // Convert compressed image ke base64
        const reader = new FileReader()
        reader.onload = (event) => {
          setForm(prev => ({ ...prev, photoUrl: event.target.result }))
        }
        reader.readAsDataURL(compressedFile)
      } catch (error) {
        console.error('Error compressing image:', error)
        alert('Gagal mengkompresi foto, coba foto lain')
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
        paid: form.status === 'done' ? Number(form.amount) : 0,
        forcedDoneSnapshot: form.status === 'done' ? { paid: 0, payments: [] } : undefined,
      }
      if (editingId) {
        await debtService.update(editingId, payload)
        setEditingId(null)
      } else {
        await debtService.create(payload)
      }
      setForm({ type: 'hutang', personName: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '', status: 'onprogress', photoUrl: '' })
      fetchDebts()
    } catch (err) {
      alert('Gagal menyimpan data')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data ini?')) return
    try {
      await debtService.delete(id)
      fetchDebts()
    } catch {
      alert('Gagal menghapus data')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert('Pilih setidaknya satu data')
      return
    }
    if (!window.confirm(`Hapus ${selectedIds.size} data?`)) return
    try {
      await Promise.all(Array.from(selectedIds).map(id => debtService.delete(id)))
      setSelectedIds(new Set())
      fetchDebts()
    } catch {
      alert('Gagal menghapus beberapa data')
    }
  }

  const toggleSelect = (id) => {
    const s = new Set(selectedIds)
    if (s.has(id)) s.delete(id); else s.add(id)
    setSelectedIds(s)
  }

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(new Set(debts.map(d => d._id)))
    else setSelectedIds(new Set())
  }

  const toggleStatus = async (d) => {
    const next = d.status === 'onprogress' ? 'done' : 'onprogress'
    try {
      const res = await debtService.updateStatus(d._id, next)
      const updated = res?.data?.data || null
      if (updated) {
        setDebts(prev => prev.map(x => x._id === d._id ? updated : x))
      } else {
        // fallback: refresh list
        fetchDebts()
      }
    } catch {
      alert('Gagal mengubah status')
    }
  }

  const openPayment = (d) => {
    setPaymentForId(d._id)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  }

  const submitPayment = async (e) => {
    e.preventDefault()
    if (!paymentForId) return
    const amt = Number(paymentForm.amount)
    if (!amt || amt <= 0) { alert('Jumlah pembayaran harus > 0'); return }
    try {
      await debtService.addPayment(paymentForId, { amount: amt, date: paymentForm.date, note: paymentForm.note })
      setPaymentForId(null)
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
      fetchDebts()
    } catch {
      alert('Gagal mencatat pembayaran')
    }
  }

  const startEdit = (d) => {
    setEditingId(d._id)
    setForm({
      type: d.type,
      personName: d.personName,
      amount: d.amount,
      date: new Date(d.date).toISOString().split('T')[0],
      reason: d.reason || '',
      status: d.status,
      photoUrl: d.photoUrl || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const mainContainer = document.querySelector('main')
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`
  
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Template kosong
    const templateData = [
      { 'Tanggal': '', 'Tipe': '', 'Nama Orang': '', 'Jumlah (Rp)': '', 'Alasan': '', 'Foto': '', 'Status': '' }
    ]
    const wsTemplate = XLSX.utils.json_to_sheet(templateData)
    wsTemplate['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 12 }]
    
    // Sheet 2: Contoh pengisian
    const exampleData = [
      { 'Tanggal': '31/12/2025', 'Tipe': 'hutang', 'Nama Orang': 'John Doe', 'Jumlah (Rp)': '5000000', 'Alasan': 'Pinjaman modal usaha', 'Foto': 'https://example.com/foto1.jpg', 'Status': 'onprogress' },
      { 'Tanggal': '30/12/2025', 'Tipe': 'piutang', 'Nama Orang': 'Jane Smith', 'Jumlah (Rp)': '3000000', 'Alasan': 'Pinjaman ke teman', 'Foto': '', 'Status': 'onprogress' },
      { 'Tanggal': '29/12/2025', 'Tipe': 'hutang', 'Nama Orang': 'Bank ABC', 'Jumlah (Rp)': '10000000', 'Alasan': 'KPR', 'Foto': '', 'Status': 'done' },
    ]
    const wsExample = XLSX.utils.json_to_sheet(exampleData)
    wsExample['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 12 }]
    
    // Sheet 3: Panduan
    const guideData = [
      { 'Kolom': 'Tanggal', 'Format': 'DD/MM/YYYY atau YYYY-MM-DD', 'Contoh': '31/12/2025', 'Wajib': 'Ya' },
      { 'Kolom': 'Tipe', 'Format': 'hutang / piutang', 'Contoh': 'hutang', 'Wajib': 'Ya' },
      { 'Kolom': 'Nama Orang', 'Format': 'Teks bebas', 'Contoh': 'John Doe', 'Wajib': 'Ya' },
      { 'Kolom': 'Jumlah (Rp)', 'Format': 'Angka tanpa pemisah ribuan', 'Contoh': '5000000', 'Wajib': 'Ya' },
      { 'Kolom': 'Alasan', 'Format': 'Teks bebas', 'Contoh': 'Pinjaman modal usaha', 'Wajib': 'Tidak' },
      { 'Kolom': 'Foto', 'Format': 'URL atau base64 atau kosongkan', 'Contoh': 'https://example.com/foto.jpg', 'Wajib': 'Tidak' },
      { 'Kolom': 'Status', 'Format': 'onprogress / done', 'Contoh': 'onprogress', 'Wajib': 'Ya' },
    ]
    const wsGuide = XLSX.utils.json_to_sheet(guideData)
    wsGuide['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }]
    
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template')
    XLSX.utils.book_append_sheet(wb, wsExample, 'Contoh')
    XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan')
    XLSX.writeFile(wb, 'Template-Import-HutangPiutang.xlsx')
  }

  const handleExportExcel = () => {
    if (debts.length === 0) { 
      alert('Tidak ada data untuk diekspor')
      return 
    }
    const data = debts.map(d => ({
      'Tanggal': new Date(d.date).toLocaleDateString('id-ID'),
      'Tipe': d.type === 'hutang' ? 'HUTANG' : 'PIUTANG',
      'Nama Orang': d.personName,
      'Jumlah (Rp)': d.amount,
      'Terbayar (Rp)': d.paid || 0,
      'Sisa (Rp)': Math.max(0, d.amount - (d.paid || 0)),
      'Alasan': d.reason || '-',
      'Ada Foto': d.photoUrl ? 'Ya' : 'Tidak',
      'Status': d.status === 'done' ? 'DONE' : 'ONPROGRESS',
    }))
    
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }]
    
    const wsSummary = XLSX.utils.json_to_sheet([
      {},
      { 'Tanggal': 'RINGKASAN' },
      { 'Tanggal': 'Total Data', 'Tipe': debts.length },
      { 'Tanggal': 'Hutang Belum Terbayar', 'Jumlah (Rp)': totals.hutangUnpaid },
      { 'Tanggal': 'Hutang Sudah Terbayar', 'Jumlah (Rp)': totals.hutangPaid },
      { 'Tanggal': 'Piutang Belum Terbayar', 'Jumlah (Rp)': totals.piutangUnpaid },
      { 'Tanggal': 'Piutang Sudah Terbayar', 'Jumlah (Rp)': totals.piutangPaid },
    ])
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 15 }]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Hutang Piutang')
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')
    XLSX.writeFile(wb, `Laporan-HutangPiutang-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      
      if (!rows || rows.length === 0) { 
        alert('File kosong atau format tidak dikenali')
        return 
      }
      
      const debtsToImport = rows.map(r => {
        const tanggal = r.Tanggal || r.Date || r.tanggal
        const tipe = r.Tipe || r.tipe || r.type
        const nama = r['Nama Orang'] || r.nama || r.personName
        const jumlahRaw = r['Jumlah (Rp)'] || r.Jumlah || r.amount
        const alasan = r.Alasan || r.alasan || r.reason || ''
        const foto = r.Foto || r.foto || r.photoUrl || ''
        const status = r.Status || r.status || 'onprogress'
        
        const amount = Number.parseFloat(String(jumlahRaw).replace(/[^0-9.-]/g, '')) || 0
        
        let date = null
        if (typeof tanggal === 'number') {
          const d = XLSX.SSF.parse_date_code(tanggal)
          if (d) date = new Date(d.y, d.m - 1, d.d).toISOString()
        } else if (tanggal) {
          const parsed = new Date(tanggal)
          if (!Number.isNaN(parsed.getTime())) date = parsed.toISOString()
        }
        
        return {
          type: String(tipe || '').toLowerCase() === 'hutang' ? 'hutang' : 'piutang',
          personName: String(nama || '').trim(),
          amount,
          date: date || new Date().toISOString(),
          reason: String(alasan || '').trim(),
          photoUrl: String(foto || '').trim(),
          status: String(status || '').toLowerCase() === 'done' ? 'done' : 'onprogress',
          paid: 0,
        }
      })
      
      if (!window.confirm(`Import ${debtsToImport.length} data hutang/piutang? Lanjutkan?`)) { 
        return 
      }
      
      for (const debt of debtsToImport) {
        await debtService.create(debt)
      }
      
      alert(`Import selesai: ${debtsToImport.length} data berhasil ditambahkan`)
      fetchDebts()
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

  const totals = (() => {
    const hutangDebts = debts.filter(d => d.type === 'hutang')
    const piutangDebts = debts.filter(d => d.type === 'piutang')
    
    // Hutang: unpaid (remaining) dan paid
    const hutangUnpaid = hutangDebts.reduce((s, d) => s + Math.max(0, Number(d.amount) - Number(d.paid || 0)), 0)
    const hutangPaid = hutangDebts.reduce((s, d) => s + (Number(d.paid) || 0), 0)
    
    // Piutang: unpaid (remaining) dan paid
    const piutangUnpaid = piutangDebts.reduce((s, d) => s + Math.max(0, Number(d.amount) - Number(d.paid || 0)), 0)
    const piutangPaid = piutangDebts.reduce((s, d) => s + (Number(d.paid) || 0), 0)
    
    return { hutangUnpaid, hutangPaid, piutangUnpaid, piutangPaid }
  })()

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">Hutang & Piutang</h1>
        <p className="text-xs lg:text-sm text-gray-600">Catat dan kelola hutang/piutang Anda</p>
      </div>

      {/* Form */}
      <div className="card" id="hutang-piutang-form">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit Data' : 'Tambah Data'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              <option value="hutang">HUTANG</option>
              <option value="piutang">PIUTANG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Orang</label>
            <input name="personName" value={form.personName} onChange={handleChange} className="input-field" placeholder="Contoh: Andi" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (Rp)</label>
            <input type="number" name="amount" value={form.amount} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Alasan/Keterangan</label>
            <textarea name="reason" value={form.reason} onChange={handleChange} className="input-field" rows={3} placeholder="Contoh: Pinjam untuk biaya ..."></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Foto Bukti Transaksi</label>
            <input ref={fileInputRef} type="file" name="photo" accept="image/*" onChange={handleChange} className="input-field" />
            {form.photoUrl && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Preview:</p>
                  <button type="button" onClick={clearPhoto} className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Hapus Foto
                  </button>
                </div>
                <img src={form.photoUrl} alt="Preview" className="w-32 h-32 object-cover rounded border border-gray-200" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option value="onprogress">ONPROGRESS</option>
              <option value="done">DONE</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn btn-primary">{editingId ? 'Simpan Perubahan' : 'Tambah'}</button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={() => {
                setEditingId(null)
                setForm({ type: 'hutang', personName: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '', status: 'onprogress' })
              }}>Batal</button>
            )}
          </div>
        </form>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-700">Hutang Belum Terbayar</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.hutangUnpaid)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-700">Hutang Sudah Terbayar</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.hutangPaid)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-700">Piutang Belum Terbayar</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.piutangUnpaid)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-700">Piutang Sudah Terbayar</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.piutangPaid)}</p>
        </div>
      </div>

      {/* Excel Import/Export Buttons */}
      <div className="mb-6 flex justify-end gap-2">
        <button onClick={handleDownloadTemplate} className="btn btn-outline flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Template Excel</button>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
          <span className="btn btn-secondary flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Import Excel</span>
        </label>
        <button onClick={handleExportExcel} className="btn btn-primary flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export Excel</button>
      </div>

      {/* List */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        ) : debts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Belum ada data</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="w-4 h-4" onChange={toggleSelectAll} checked={debts.length>0 && selectedIds.size===debts.length} />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipe</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Jumlah</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Terbayar</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Sisa</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Alasan</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-left">
                    <input type="checkbox" className="w-4 h-4" checked={selectedIds.has(d._id)} onChange={() => toggleSelect(d._id)} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{d.type === 'hutang' ? 'HUTANG' : 'PIUTANG'}</td>
                  <td className="px-4 py-3 text-sm">{d.personName}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-700 font-semibold">{formatCurrency(d.amount)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(d.paid || 0)}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.max(0, (Number(d.amount)||0) - (Number(d.paid)||0)))}</td>
                  <td className="px-4 py-3 text-sm">{new Date(d.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{d.reason || '-'}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button onClick={() => toggleStatus(d)} className={`px-3 py-1 rounded text-xs font-semibold ${d.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {d.status === 'done' ? 'DONE' : 'ONPROGRESS'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-center space-x-2">
                    {d.photoUrl && (
                      <button onClick={() => setViewPhotoUrl(d.photoUrl)} className="text-green-600 hover:text-green-800 font-medium">Foto</button>
                    )}
                    <button onClick={() => startEdit(d)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    <button onClick={() => handleDelete(d._id)} className="text-red-500 hover:text-red-700 font-medium">Hapus</button>
                    <button onClick={() => openPayment(d)} className="text-purple-600 hover:text-purple-800 font-medium">Bayar/Cicil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="mt-4 flex justify-end">
            <button className="btn bg-red-500 text-white hover:bg-red-600" onClick={handleBulkDelete}>Hapus {selectedIds.size} Data</button>
          </div>
        )}
      </div>

      {paymentForId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="fixed inset-0 bg-black opacity-40" style={{zIndex:50}} onClick={() => setPaymentForId(null)}></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 z-60 w-full max-w-md mx-4" style={{zIndex:60}} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Catat Pembayaran</h3>
            <form onSubmit={submitPayment} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(prev => ({...prev, amount: e.target.value}))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(prev => ({...prev, date: e.target.value}))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                <input type="text" value={paymentForm.note} onChange={e => setPaymentForm(prev => ({...prev, note: e.target.value}))} className="input-field" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentForId(null)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo View Modal */}
      {viewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black opacity-70" style={{zIndex:50}} onClick={() => setViewPhotoUrl(null)}></div>
          <div className="relative bg-white rounded-lg shadow-lg p-4 z-60 max-w-4xl max-h-[90vh] overflow-auto" style={{zIndex:60}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Foto Bukti Transaksi</h3>
              <button onClick={() => setViewPhotoUrl(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <img src={viewPhotoUrl} alt="Bukti Transaksi" className="w-full h-auto rounded border border-gray-200" />
          </div>
        </div>
      )}
    </div>
  )
}

export default HutangPiutang
