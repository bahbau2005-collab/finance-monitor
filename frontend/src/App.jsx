import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { healthCheck, authService, getToken, clearToken } from './services/api'

// Pages
import Dashboard from './pages/Dashboard'
import Aset from './pages/Aset'
import Cash from './pages/Cash'
import ArusKas from './pages/ArusKas'
import Laporan from './pages/Laporan'
import HutangPiutang from './pages/HutangPiutang'
import Login from './pages/Login'
import ChangePasswordModal from './components/ChangePasswordModal'

// Elegant line icons (transparent, inherit color via currentColor)
const iconProps = {
  className: 'w-6 h-6 flex-shrink-0',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
}

const DashboardIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)

const AsetIcon = () => (
  <svg {...iconProps}>
    <path d="M3 3v18h18" />
    <path d="M7 14l3.5-4 3 2.5L21 6" />
    <path d="M21 11V6h-5" />
  </svg>
)

const CashIcon = () => (
  <svg {...iconProps}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 9.5v.01M18 14.5v.01" />
  </svg>
)

const ArusKasIcon = () => (
  <svg {...iconProps}>
    <path d="M7 17V9m0 0L4 12m3-3l3 3" />
    <path d="M17 7v8m0 0l3-3m-3 3l-3-3" />
  </svg>
)

const HutangPiutangIcon = () => (
  <svg {...iconProps}>
    <path d="M7 7h12l-3-3" />
    <path d="M17 17H5l3 3" />
  </svg>
)

const LaporanIcon = () => (
  <svg {...iconProps}>
    <path d="M4 19V5a1 1 0 011-1h14a1 1 0 011 1v14" />
    <path d="M4 19h16" />
    <path d="M8 16v-4M12 16V9M16 16v-6" />
  </svg>
)

function AppContent({ onLogout }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  // Kunci scroll background saat sidebar (drawer) terbuka di HP
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg sticky top-0 z-50">
        <div className="px-4 lg:px-6 py-4 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-3xl font-bold text-white tracking-tight whitespace-nowrap">Finance Monitor</h1>
              <p className="text-blue-100 text-[11px] lg:text-sm mt-1 truncate">Personal Finance Management System</p>
            </div>
            {/* Tombol Ganti Password */}
            <button
              onClick={() => setPwOpen(true)}
              className="ml-2 px-3 py-2 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 text-white"
              title="Ganti Password"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM7 11a5 5 0 00-5 5v1h10M16 11l5 5m0-5l-5 5" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Password</span>
            </button>
            {/* Tombol Logout */}
            <button
              onClick={onLogout}
              className="ml-2 px-3 py-2 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 text-white"
              title="Keluar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4M21 3v18" />
              </svg>
              <span className="hidden sm:inline text-sm font-medium">Keluar</span>
            </button>
            {/* Hamburger Menu untuk Mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden ml-2 p-2 hover:bg-blue-500 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside className={`fixed lg:sticky left-0 top-20 w-64 bg-white/95 lg:bg-white/80 backdrop-blur-md shadow-xl h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-r border-blue-100 transition-transform duration-300 z-30 flex-shrink-0 pb-4 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <nav className="p-6 space-y-2">
            {/* Dashboard Menu */}
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <DashboardIcon />
              <span>Dashboard</span>
            </Link>

            {/* Aset Menu (Input + Laporan) */}
            <Link
              to="/aset"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/aset'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <AsetIcon />
              <span>Aset</span>
            </Link>

            {/* Cash Menu */}
            <Link
              to="/cash"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/cash'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <CashIcon />
              <span>Cash</span>
            </Link>

            {/* Arus Kas Menu */}
            <Link
              to="/arus-kas"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/arus-kas'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <ArusKasIcon />
              <span>Arus Kas</span>
            </Link>

            {/* Hutang & Piutang Menu */}
            <Link
              to="/hutang-piutang"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/hutang-piutang'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <HutangPiutangIcon />
              <span>Hutang & Piutang</span>
            </Link>

            {/* Laporan Menu */}
            <Link
              to="/laporan-keuangan"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/laporan-keuangan'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <LaporanIcon />
              <span>Laporan</span>
            </Link>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aset" element={<Aset />} />
            {/* Backward-compatible routes mapped to Aset */}
            <Route path="/input" element={<Aset />} />
            <Route path="/laporan" element={<Aset />} />
            <Route path="/cash" element={<Cash />} />
            <Route path="/arus-kas" element={<ArusKas />} />
            <Route path="/laporan-keuangan" element={<Laporan />} />
            <Route path="/hutang-piutang" element={<HutangPiutang />} />
          </Routes>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-blue-100">
        <div className="px-4 lg:px-6 py-6 lg:py-8 text-center text-gray-600 text-xs lg:text-sm">
          <p>© 2025 Finance Monitor. Elegant Financial Management.</p>
        </div>
      </footer>

      {/* Modal Ganti Password */}
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  )
}

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  // Saat App mount: cek koneksi backend, lalu cek validitas token (jika ada)
  useEffect(() => {
    const init = async () => {
      try {
        await healthCheck()
        setIsConnected(true)
      } catch (error) {
        console.error('Backend connection failed:', error)
        setIsConnected(false)
        setLoading(false)
        return
      }

      const token = getToken()
      if (!token) {
        setIsAuthed(false)
        setLoading(false)
        return
      }
      try {
        await authService.verify()
        setIsAuthed(true)
      } catch {
        clearToken()
        setIsAuthed(false)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const handleLogout = () => {
    clearToken()
    setIsAuthed(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Connection Failed</h1>
          <p className="text-red-600 mb-4">Pastikan backend server sudah berjalan di port 5000</p>
          <p className="text-gray-600">Buka terminal dan jalankan: npm run dev (di folder backend)</p>
        </div>
      </div>
    )
  }

  if (!isAuthed) {
    return <Login onSuccess={() => setIsAuthed(true)} />
  }

  return (
    <Router>
      <AppContent onLogout={handleLogout} />
    </Router>
  )
}

export default App
