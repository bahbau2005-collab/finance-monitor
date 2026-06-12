/**
 * Modal reusable — konsisten di seluruh aplikasi.
 * - Di HP: tampil sebagai bottom-sheet (naik dari bawah, mudah dijangkau).
 * - Di desktop: dialog di tengah layar.
 * Props:
 *   open      : boolean, tampil/tidak
 *   onClose   : fungsi saat backdrop / tombol tutup diklik
 *   title     : judul header
 *   subtitle  : opsional, teks/elemen kecil di bawah judul (mis. nama + sisa)
 *   size      : 'md' (default) | 'lg' (lebih lebar untuk form panjang)
 *   children  : isi modal (biasanya <form>)
 */
function Modal({ open, onClose, title, subtitle, size = 'md', children }) {
  if (!open) return null
  const widthClass = size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-md'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div
        role="dialog"
        aria-modal="true"
        className={`relative bg-white w-full ${widthClass} rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header sticky */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none px-2 -mr-2 shrink-0"
              aria-label="Tutup"
            >
              &times;
            </button>
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
