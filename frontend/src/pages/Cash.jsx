import { useEffect, useState } from 'react'
import { cashService } from '../services/api'

function Cash() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const res = await cashService.getAll()
      setAccounts(res.data.data)
    } catch (err) {
      console.error('Gagal mengambil accounts', err)
      alert('Gagal mengambil data rekening')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const res = await cashService.create({ name, balance: Number(balance) || 0 })
      setAccounts(prev => [res.data.data, ...prev])
      setName('')
      setBalance('')
    } catch (err) {
      console.error('Gagal membuat account', err)
      alert('Gagal membuat rekening')
    }
  }

  const openEdit = (acc) => {
    setEditing({ id: acc._id, balance: acc.balance, name: acc.name })
  }

  const closeEdit = () => setEditing(null)

  const submitBalance = async (e) => {
    e.preventDefault()
    try {
      const res = await cashService.updateBalance(editing.id, { balance: Number(editing.balance) || 0, updatedAt: new Date().toISOString() })
      setAccounts(prev => prev.map(a => a._id === editing.id ? res.data.data : a))
      closeEdit()
    } catch (err) {
      console.error('Gagal update balance', err)
      alert('Gagal memperbarui saldo')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus rekening ini?')) return
    try {
      await cashService.delete(id)
      setAccounts(prev => prev.filter(a => a._id !== id))
    } catch (err) {
      console.error('Gagal hapus rekening', err)
      alert('Gagal menghapus rekening')
    }
  }

  return (
    <div>
      {/* TOTAL CASH */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="card">
          <p className="text-gray-600 text-xs lg:text-sm mb-2">Total Cash</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-green-600">
            Rp {accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0).toLocaleString('id-ID')}
          </h2>
          <p className="text-gray-500 text-xs mt-2">Jumlah saldo pada semua rekening cash</p>
        </div>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold">Cash Accounts</h1>
        <p className="text-xs lg:text-sm text-gray-600">Kelola rekening tunai Anda (bank, dompet, dll)</p>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold mb-3 text-sm lg:text-base">Tambah Rekening Baru</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input placeholder="Nama Rekening (contoh: Mandiri)" value={name} onChange={e => setName(e.target.value)} className="input-field" />
          <input placeholder="Saldo awal (Rp)" type="number" value={balance} onChange={e => setBalance(e.target.value)} className="input-field" />
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1 lg:flex-none" type="submit">Tambah Rekening</button>
            <button type="button" className="btn btn-secondary flex-1 lg:flex-none" onClick={() => { setName(''); setBalance('') }}>Reset</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8">Belum ada rekening cash. Tambah untuk memulai.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(acc => (
            <div key={acc._id} className="card">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-base lg:text-lg">{acc.name}</h4>
                  <p className="text-xs lg:text-sm text-gray-500">Saldo saat ini</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">Rp {Number(acc.balance).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-500">Terakhir diupdate: {acc.lastUpdated ? new Date(acc.lastUpdated).toLocaleString('id-ID') : '-'}</p>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <button className="btn btn-outline w-full sm:w-auto" onClick={() => openEdit(acc)}>Update Saldo</button>
                  <button className="btn btn-danger w-full sm:w-auto" onClick={() => handleDelete(acc._id)}>Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT BALANCE MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
          <div className="absolute inset-0 bg-black opacity-40" onClick={closeEdit}></div>
          <div className="bg-white rounded-lg shadow-lg p-6 z-60 w-full max-w-md mx-4 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Update Saldo - {editing.name}</h3>
            <form onSubmit={submitBalance} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Saldo (Rp)</label>
                <input type="number" value={editing.balance} onChange={e => setEditing(prev => ({ ...prev, balance: e.target.value }))} className="input-field" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={closeEdit}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cash
