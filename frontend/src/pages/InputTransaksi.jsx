import { useState } from 'react'
import { transactionService } from '../services/api'

function InputTransaksi() {
  const [formData, setFormData] = useState({
    assetType: 'crypto',
    assetName: '',
    nominal: '',
    quantity: '',
    transactionDate: new Date().toISOString().split('T')[0],
    description: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validasi
      if (!formData.assetName.trim()) {
        setError('Nama aset tidak boleh kosong')
        setLoading(false)
        return
      }

      if (!formData.nominal || formData.nominal <= 0) {
        setError('Nominal harus lebih besar dari 0')
        setLoading(false)
        return
      }

      // For unit-based assets require quantity
      if (['btc', 'crypto', 'gold', 'saham'].includes(formData.assetType)) {
        if (!formData.quantity || Number(formData.quantity) <= 0) {
          setError('Jumlah (quantity) harus diisi dan lebih besar dari 0 untuk tipe aset ini')
          setLoading(false)
          return
        }
      }

      // Submit data
      await transactionService.create({
        ...formData,
        nominal: parseInt(formData.nominal),
        quantity: formData.quantity ? parseFloat(formData.quantity) : 0,
      })

      setSuccess(true)
      // Reset form
      setFormData({
        assetType: 'crypto',
        assetName: '',
        nominal: '',
        quantity: '',
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
      })

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error creating transaction:', err)
      setError(err.response?.data?.message || 'Gagal menyimpan transaksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* PAGE TITLE */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Input Transaksi</h1>
        <p className="text-gray-600">Tambahkan transaksi aset baru Anda</p>
      </div>

      {/* FORM CARD */}
      <div className="card">
        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">✓ Transaksi berhasil disimpan!</p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">✗ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ASSET TYPE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Aset <span className="text-red-500">*</span>
            </label>
            <select
              name="assetType"
              value={formData.assetType}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="btc">Bitcoin (BTC)</option>
              <option value="crypto">Cryptocurrency (Other)</option>
              <option value="saham">Saham</option>
              <option value="gold">Emas / Logam Mulia</option>
            </select>
            <p className="text-gray-500 text-xs mt-1">Pilih tipe aset yang ingin diinputkan</p>
          </div>

          {/* ASSET NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Aset <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="assetName"
              value={formData.assetName}
              onChange={handleInputChange}
              placeholder="Contoh: Bitcoin, Rupiah, Emas 24 Karat"
              className="input-field"
            />
            <p className="text-gray-500 text-xs mt-1">Contoh: Bitcoin, Ethereum, IDR, Gram Emas, dll</p>
          </div>

          {/* NOMINAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nominal Transaksi (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="nominal"
              value={formData.nominal}
              onChange={handleInputChange}
              placeholder="Contoh: 5000000"
              min="0"
              className="input-field"
            />
            <p className="text-gray-500 text-xs mt-1">Masukkan dalam Rupiah</p>
          </div>

          {/* TRANSACTION DATE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Transaksi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleInputChange}
              className="input-field"
            />
            <p className="text-gray-500 text-xs mt-1">Tanggal kapan transaksi ini terjadi</p>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan <span className="text-gray-500">(Opsional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Contoh: Beli Bitcoin untuk investasi jangka panjang"
              rows="4"
              className="input-field"
            />
            <p className="text-gray-500 text-xs mt-1">Catatan tambahan untuk transaksi ini</p>
          </div>

          {/* QUANTITY - conditional for btc/crypto/gold/saham */}
          {['btc', 'crypto', 'gold', 'saham'].includes(formData.assetType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah ({formData.assetType === 'btc' || formData.assetType === 'crypto' ? 'koin' : formData.assetType === 'gold' ? 'gram' : 'lembar'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder={formData.assetType === 'btc' || formData.assetType === 'crypto' ? 'Contoh: 0.025' : formData.assetType === 'gold' ? 'Contoh: 1.5 (gram)' : 'Contoh: 10 (lembar)'}
                className="input-field"
              />
              <p className="text-gray-500 text-xs mt-1">Masukkan jumlah aset sesuai unit</p>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
            <button
              type="reset"
              className="btn btn-secondary flex-1"
              onClick={() => setFormData({
                assetType: 'btc',
                assetName: '',
                nominal: '',
                transactionDate: new Date().toISOString().split('T')[0],
                description: '',
              })}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>

      {/* INFO BOX */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips Input</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Simpan setiap transaksi aset Anda untuk tracking yang akurat</li>
          <li>✓ Gunakan nama aset yang konsisten agar laporan lebih rapi</li>
          <li>✓ Tanggal transaksi penting untuk analisis historis</li>
        </ul>
      </div>
    </div>
  )
}

export default InputTransaksi
