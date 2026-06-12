import { useEffect, useMemo, useState } from 'react'
import { debtService } from '../services/api'
import Modal from '../components/Modal'

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
  })

  const [formErrors, setFormErrors] = useState({})
  const [formMsg, setFormMsg] = useState(null) // { type: 'success' | 'error', text }
  const [saving, setSaving] = useState(false) // cegah double-submit (form data)
  const [savingPayment, setSavingPayment] = useState(false) // cegah double-submit (pembayaran)
  const [editingId, setEditingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [paymentForId, setPaymentForId] = useState(null)
  const [paymentEdit, setPaymentEdit] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  const [expandedPaymentId, setExpandedPaymentId] = useState(null)
  const [expandedReason, setExpandedReason] = useState(new Set())

  const toggleReason = (id) => {
    setExpandedReason(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const [filters, setFilters] = useState({ query: '', type: '', status: '' })
  const [sort, setSort] = useState({ field: '', direction: 'asc' })

  useEffect(() => {
    fetchDebts()
  }, [])

  const filteredAndSortedDebts = useMemo(() => {
    let items = [...debts]

    // FILTER
    const query = (filters.query || '').toLowerCase().trim()
    if (query) {
      items = items.filter(d => {
        const name = String(d.personName || '').toLowerCase()
        const reason = String(d.reason || '').toLowerCase()
        return name.includes(query) || reason.includes(query)
      })
    }

    if (filters.type) {
      items = items.filter(d => d.type === filters.type)
    }

    if (filters.status) {
      items = items.filter(d => d.status === filters.status)
    }

    // SORT
    if (sort.field) {
      const compare = (a, b) => {
        switch (sort.field) {
          case 'type':
            return String(a.type || '').localeCompare(String(b.type || ''), undefined, { sensitivity: 'base' })
          case 'name':
            return String(a.personName || '').localeCompare(String(b.personName || ''), undefined, { sensitivity: 'base' })
          case 'amount':
            return (Number(a.amount) || 0) - (Number(b.amount) || 0)
          case 'paid':
            return (Number(a.paid) || 0) - (Number(b.paid) || 0)
          case 'remaining':
            return (Number(a.amount || 0) - Number(a.paid || 0)) - (Number(b.amount || 0) - Number(b.paid || 0))
          case 'date':
            return new Date(a.date) - new Date(b.date)
          case 'status':
            return String(a.status || '').localeCompare(String(b.status || ''), undefined, { sensitivity: 'base' })
          default:
            return 0
        }
      }
      items.sort((a, b) => (sort.direction === 'asc' ? compare(a, b) : -compare(a, b)))
    }

    return items
  }, [debts, filters, sort])

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const resetFilters = () => {
    setFilters({ query: '', type: '', status: '' })
  }

  const toggleSort = (field) => {
    setSort(prev => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { field, direction: 'asc' }
    })
  }

  const getSortIcon = (field) => {
    if (sort.field !== field) return null
    return sort.direction === 'asc' ? '↑' : '↓'
  }

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Hapus error field ini begitu user mulai memperbaikinya
    setFormErrors(prev => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  // Validasi form, kembalikan object error per-field (kosong = valid)
  const validateForm = () => {
    const errors = {}
    const today = new Date(); today.setHours(23, 59, 59, 999)

    if (!form.personName || !form.personName.trim()) {
      errors.personName = 'Nama orang wajib diisi'
    } else if (form.personName.trim().length < 2) {
      errors.personName = 'Nama minimal 2 karakter'
    }

    if (form.amount === '' || form.amount === null) {
      errors.amount = 'Jumlah wajib diisi'
    } else if (Number.isNaN(Number(form.amount))) {
      errors.amount = 'Jumlah harus berupa angka'
    } else if (Number(form.amount) <= 0) {
      errors.amount = 'Jumlah harus lebih besar dari 0'
    }

    if (!form.date) {
      errors.date = 'Tanggal wajib diisi'
    } else if (new Date(form.date) > today) {
      errors.date = 'Tanggal tidak boleh melebihi hari ini'
    }

    if (form.reason && form.reason.length > 500) {
      errors.reason = 'Keterangan maksimal 500 karakter'
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return // cegah double-submit saat request masih berjalan
    setFormMsg(null)

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      const count = Object.keys(errors).length
      setFormMsg({ type: 'error', text: `Ada ${count} kolom yang perlu diperbaiki. Lihat keterangan merah di bawah kolom terkait.` })
      return
    }
    setFormErrors({})

    setSaving(true)
    try {
      const payload = {
        ...form,
        personName: form.personName.trim(),
        amount: Number(form.amount),
        date: new Date(form.date).toISOString(),
      }
      if (editingId) {
        await debtService.update(editingId, payload)
        setEditingId(null)
      } else {
        await debtService.create(payload)
      }
      setForm({ type: 'hutang', personName: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '', status: 'onprogress' })
      setFormMsg({ type: 'success', text: editingId ? 'Perubahan berhasil disimpan.' : 'Data berhasil ditambahkan.' })
      setTimeout(() => setFormMsg(null), 3000)
      fetchDebts()
    } catch (err) {
      // Tampilkan pesan spesifik dari backend jika ada
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error
      setFormMsg({ type: 'error', text: backendMsg ? `Gagal menyimpan: ${backendMsg}` : 'Gagal menyimpan data. Periksa koneksi ke server dan coba lagi.' })
    } finally {
      setSaving(false)
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
    if (e.target.checked) setSelectedIds(new Set(filteredAndSortedDebts.map(d => d._id)))
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
    setPaymentEdit(null)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  }

  const openEditPayment = (debtId, index, payment) => {
    setPaymentForId(null)
    setPaymentEdit({ debtId, index, amount: payment.amount, date: new Date(payment.date).toISOString().split('T')[0], note: payment.note || '' })
    setPaymentForm({ amount: payment.amount, date: new Date(payment.date).toISOString().split('T')[0], note: payment.note || '' })
  }

  const closePaymentModal = () => {
    setPaymentForId(null)
    setPaymentEdit(null)
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], note: '' })
  }

  const submitPayment = async (e) => {
    e.preventDefault()
    if (savingPayment) return // cegah double-submit pembayaran
    const amt = Number(paymentForm.amount)
    if (!amt || amt <= 0) { alert('Jumlah pembayaran harus > 0'); return }

    setSavingPayment(true)
    try {
      if (paymentEdit) {
        await debtService.updatePayment(paymentEdit.debtId, paymentEdit.index, { amount: amt, date: paymentForm.date, note: paymentForm.note })
      } else if (paymentForId) {
        await debtService.addPayment(paymentForId, { amount: amt, date: paymentForm.date, note: paymentForm.note })
      } else {
        setSavingPayment(false)
        return
      }

      closePaymentModal()
      fetchDebts()
    } catch {
      alert('Gagal menyimpan pembayaran')
    } finally {
      setSavingPayment(false)
    }
  }

  const deletePayment = async (debtId, index) => {
    if (!window.confirm('Hapus pembayaran ini?')) return
    try {
      await debtService.deletePayment(debtId, index)
      fetchDebts()
    } catch {
      alert('Gagal menghapus pembayaran')
    }
  }

  const startEdit = (d) => {
    setFormErrors({})
    setFormMsg(null)
    setEditingId(d._id)
    setForm({
      type: d.type,
      personName: d.personName,
      amount: d.amount,
      date: new Date(d.date).toISOString().split('T')[0],
      reason: d.reason || '',
      status: d.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`
  const totals = (() => {
    const totalHutang = debts.filter(d => d.type === 'hutang').reduce((s, d) => s + (Number(d.amount) || 0), 0)
    const totalPiutang = debts.filter(d => d.type === 'piutang').reduce((s, d) => s + (Number(d.amount) || 0), 0)
    const hutangRemaining = debts.filter(d => d.type === 'hutang').reduce((s, d) => s + Math.max(0, Number(d.amount) - Number(d.paid || 0)), 0)
    const piutangRemaining = debts.filter(d => d.type === 'piutang').reduce((s, d) => s + Math.max(0, Number(d.amount) - Number(d.paid || 0)), 0)
    return { totalHutang, totalPiutang, hutangRemaining, piutangRemaining }
  })()

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-ink mb-2">Hutang & Piutang</h1>
        <p className="text-xs lg:text-sm text-gray-600">Catat dan kelola hutang/piutang Anda</p>
      </div>

      {/* Form */}
      <div className="card">
        <h3 className="text-lg font-semibold text-ink mb-4">{editingId ? 'Edit Data' : 'Tambah Data'}</h3>

        {formMsg && (
          <div className={`mb-4 p-3 rounded-lg border flex items-start gap-2 ${formMsg.type === 'success' ? 'bg-green-50 border-green-200 text-up' : 'bg-red-50 border-red-200 text-down'}`}>
            <span className="font-bold">{formMsg.type === 'success' ? '✓' : '✗'}</span>
            <span className="text-sm">{formMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-field">
              <option value="hutang">HUTANG</option>
              <option value="piutang">PIUTANG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Orang <span className="text-down">*</span></label>
            <input name="personName" value={form.personName} onChange={handleChange} className={`input-field ${formErrors.personName ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="Contoh: Andi" />
            {formErrors.personName && <p className="mt-1 text-xs text-down">{formErrors.personName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah (Rp) <span className="text-down">*</span></label>
            <input type="number" name="amount" value={form.amount} onChange={handleChange} className={`input-field ${formErrors.amount ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="Contoh: 500000" />
            {formErrors.amount && <p className="mt-1 text-xs text-down">{formErrors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal <span className="text-down">*</span></label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className={`input-field ${formErrors.date ? 'border-red-500 focus:ring-red-500' : ''}`} />
            {formErrors.date && <p className="mt-1 text-xs text-down">{formErrors.date}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Alasan/Keterangan</label>
            <textarea name="reason" value={form.reason} onChange={handleChange} className={`input-field ${formErrors.reason ? 'border-red-500 focus:ring-red-500' : ''}`} rows={3} placeholder="Contoh: Pinjam untuk biaya ..."></textarea>
            {formErrors.reason && <p className="mt-1 text-xs text-down">{formErrors.reason}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-field">
              <option value="onprogress">ONPROGRESS</option>
              <option value="done">DONE</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>
              {saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah')}
            </button>
          </div>
        </form>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-700">Total Hutang</p>
          <p className="text-2xl font-bold figure-down">{formatCurrency(totals.totalHutang)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-700">Total Piutang</p>
          <p className="text-2xl font-bold figure-up">{formatCurrency(totals.totalPiutang)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-700">Sisa Hutang</p>
          <p className="text-2xl font-bold figure-down">{formatCurrency(totals.hutangRemaining)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-700">Sisa Piutang</p>
          <p className="text-2xl font-bold text-ink">{formatCurrency(totals.piutangRemaining)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari (nama / alasan)</label>
            <input
              type="text"
              value={filters.query}
              onChange={e => handleFilterChange('query', e.target.value)}
              className="input-field"
              placeholder="Cari..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className="input-field">
              <option value="">Semua</option>
              <option value="hutang">HUTANG</option>
              <option value="piutang">PIUTANG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="input-field">
              <option value="">Semua</option>
              <option value="onprogress">ONPROGRESS</option>
              <option value="done">DONE</option>
            </select>
          </div>
          {(filters.query || filters.type || filters.status) && (
            <div className="flex items-end">
              <button type="button" className="btn btn-secondary w-full" onClick={resetFilters}>
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-down">{error}</div>
        ) : filteredAndSortedDebts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {filters.query || filters.type || filters.status ? 'Tidak ada data yang sesuai filter' : 'Belum ada data'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="w-4 h-4" onChange={toggleSelectAll} checked={filteredAndSortedDebts.length>0 && selectedIds.size===filteredAndSortedDebts.length} />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none" onClick={() => toggleSort('type')}>
                  Tipe {getSortIcon('type')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  Nama {getSortIcon('name')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                  Jumlah {getSortIcon('amount')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer select-none" onClick={() => toggleSort('paid')}>
                  Terbayar {getSortIcon('paid')}
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer select-none" onClick={() => toggleSort('remaining')}>
                  Sisa {getSortIcon('remaining')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none" onClick={() => toggleSort('date')}>
                  Tanggal {getSortIcon('date')}
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Keterangan</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status {getSortIcon('status')}
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDebts.map((d) => {
                const isExpanded = expandedPaymentId === d._id
                return (
                  <>
                  <tr key={d._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-left">
                      <input type="checkbox" className="w-4 h-4" checked={selectedIds.has(d._id)} onChange={() => toggleSelect(d._id)} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{d.type === 'hutang' ? 'HUTANG' : 'PIUTANG'}</td>
                    <td className="px-4 py-3 text-sm">{d.personName}</td>
                    <td className="px-4 py-3 text-sm text-right text-up font-semibold">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(d.paid || 0)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(Math.max(0, (Number(d.amount)||0) - (Number(d.paid)||0)))}</td>
                    <td className="px-4 py-3 text-sm">{new Date(d.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      {d.reason ? (
                        <button
                          type="button"
                          onClick={() => toggleReason(d._id)}
                          title={expandedReason.has(d._id) ? 'Klik untuk ringkas' : d.reason}
                          className={`text-left w-full hover:text-accentink ${expandedReason.has(d._id) ? 'whitespace-pre-wrap break-words' : 'truncate'}`}
                        >
                          {d.reason}
                        </button>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <button onClick={() => toggleStatus(d)} className={`px-3 py-1 rounded text-xs font-semibold ${d.status === 'done' ? 'bg-upsoft text-upink' : 'bg-accentsoft text-accentink'}`}>
                        {d.status === 'done' ? 'DONE' : 'ONPROGRESS'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-center space-x-2">
                      <button onClick={() => setExpandedPaymentId(isExpanded ? null : d._id)} className="text-accentink hover:opacity-70 font-medium text-xs" title="Lihat riwayat pembayaran">📋</button>
                      <button onClick={() => startEdit(d)} className="text-accentink hover:opacity-70 font-medium text-xs">Edit</button>
                      <button onClick={() => handleDelete(d._id)} className="text-down hover:opacity-70 font-medium text-xs">Hapus</button>
                      <button onClick={() => openPayment(d)} className="text-accentink hover:opacity-70 font-medium text-xs">Bayar</button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-line bg-surface2">
                      <td colSpan="10" className="px-6 py-4">
                        {d.payments && d.payments.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-ink text-sm">Riwayat Pembayaran ({d.payments.length})</h4>
                            <div className="space-y-2">
                              {d.payments.map((pmt, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded p-3">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600 text-xs font-medium">Tanggal</p>
                                      <p className="font-medium text-ink">{new Date(pmt.date).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 text-xs font-medium">Jumlah Bayar</p>
                                      <p className="font-medium text-up">{formatCurrency(pmt.amount)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 text-xs font-medium">Catatan</p>
                                      <p className="font-medium text-ink">{pmt.note || '-'}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <button type="button" className="text-accentink hover:opacity-70 text-xs font-semibold" onClick={() => openEditPayment(d._id, idx, pmt)}>
                                        Edit
                                      </button>
                                      <button type="button" className="text-down hover:opacity-70 text-xs font-semibold" onClick={() => deletePayment(d._id, idx)}>
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Belum ada riwayat pembayaran</p>
                        )}
                      </td>
                    </tr>
                  )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="mt-4 flex justify-end">
            <button className="btn btn-danger" onClick={handleBulkDelete}>Hapus {selectedIds.size} Data</button>
          </div>
        )}
      </div>

      {/* MODAL: Catat / Edit Pembayaran (bottom-sheet di HP, dialog di desktop) */}
      {(paymentForId || paymentEdit) && (() => {
        const activeDebt = debts.find(d => d._id === (paymentForId || paymentEdit?.debtId))
        const sisa = activeDebt ? Math.max(0, (Number(activeDebt.amount) || 0) - (Number(activeDebt.paid) || 0)) : 0
        return (
          <Modal
            open
            onClose={closePaymentModal}
            title={paymentEdit ? 'Edit Pembayaran' : 'Catat Pembayaran'}
            subtitle={activeDebt ? (
              <>
                <span className="font-medium text-gray-700">{activeDebt.personName}</span>
                {' · Sisa '}
                <span className="font-semibold text-down">{formatCurrency(sisa)}</span>
              </>
            ) : null}
          >
              <form onSubmit={submitPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah Bayar</label>
                  <input type="number" inputMode="numeric" value={paymentForm.amount} onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))} className="input-field text-base" placeholder="Contoh: 100000" autoFocus />
                  {!paymentEdit && sisa > 0 && (
                    <button type="button" onClick={() => setPaymentForm(prev => ({ ...prev, amount: String(sisa) }))} className="mt-2 text-xs font-medium text-accentink hover:opacity-70">
                      Isi penuh — lunaskan {formatCurrency(sisa)}
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal</label>
                  <input type="date" value={paymentForm.date} onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))} className="input-field text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
                  <input type="text" value={paymentForm.note} onChange={e => setPaymentForm(prev => ({ ...prev, note: e.target.value }))} className="input-field text-base" placeholder="Misal: transfer BCA" />
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
                  <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={closePaymentModal}>Batal</button>
                  <div className="flex gap-2">
                    {paymentEdit && (
                      <button type="button" className="btn btn-danger flex-1 sm:flex-none" onClick={() => deletePayment(paymentEdit.debtId, paymentEdit.index)} disabled={savingPayment}>Hapus</button>
                    )}
                    <button type="submit" className="btn btn-primary flex-1 sm:flex-none disabled:opacity-60 disabled:cursor-not-allowed" disabled={savingPayment}>{savingPayment ? 'Menyimpan...' : 'Simpan'}</button>
                  </div>
                </div>
              </form>
          </Modal>
        )
      })()}
    </div>
  )
}

export default HutangPiutang
