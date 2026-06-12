import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { healthCheck, authService, getToken, clearToken } from './services/api'

// Pages
import Dashboard from './pages/Dashboard'
import Aset from './pages/Aset'
import Cash from './pages/Cash'
import ArusKas from './pages/ArusKas'
import Laporan from './pages/Laporan'
import Target from './pages/Target'
import HutangPiutang from './pages/HutangPiutang'
import Pengaturan from './pages/Pengaturan'
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

const TargetIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.6" fill="currentColor" />
  </svg>
)

const SettingIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7.7 1.6 1.6 0 01-3.2 0 1.6 1.6 0 00-2.7-.7l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.5-2.7 1.6 1.6 0 010-3.2 1.6 1.6 0 001.5-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-.7 1.6 1.6 0 013.2 0 1.6 1.6 0 002.7.7l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00.7 2.7 1.6 1.6 0 010 3.2 1.6 1.6 0 00-1 .9z" />
  </svg>
)

function AppContent({ onLogout, dark, onToggleTheme }) {
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
    <div className="h-screen flex flex-col overflow-hidden bg-bg text-ink">
      {/* HEADER */}
      <header className="bg-surface border-b border-line z-50 flex-shrink-0">
        <div className="px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="flex w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-accentsoft text-accentink items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l7-4 7 4-7 4-7-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l7 4 7-4M5 16l7 4 7-4" />
                </svg>
              </span>
              <div className="min-w-0">
                <h1 className="text-lg lg:text-2xl font-bold text-ink tracking-tight whitespace-nowrap">Finance Monitor</h1>
                <p className="text-inksoft text-[11px] lg:text-sm mt-0.5 truncate">Personal Finance Management</p>
              </div>
            </div>
            {/* Logout */}
            <button
              onClick={onLogout}
              className="ml-1 px-2.5 py-2 hover:bg-surface2 rounded-lg transition-colors flex items-center gap-2 text-inksoft"
              title="Keluar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4M21 3v18" />
              </svg>
              <span className="hidden md:inline text-sm font-medium">Keluar</span>
            </button>
            {/* Hamburger (HP) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden ml-1 p-2 hover:bg-surface2 rounded-lg transition-colors text-inksoft"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <aside className={`fixed lg:static inset-y-0 lg:inset-auto left-0 z-30 lg:z-auto w-64 bg-surface shadow-xl lg:shadow-none h-full overflow-y-auto overscroll-contain border-r border-line transition-transform duration-300 flex-shrink-0 pt-20 lg:pt-0 pb-4 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <nav className="p-6 space-y-2">
            {/* Dashboard Menu */}
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/'
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
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
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
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
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
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
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
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
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
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
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
              }`}
            >
              <LaporanIcon />
              <span>Laporan</span>
            </Link>

            {/* Target Menu */}
            <Link
              to="/target"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/target'
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
              }`}
            >
              <TargetIcon />
              <span>Target</span>
            </Link>

            {/* Pengaturan Menu */}
            <Link
              to="/pengaturan"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/pengaturan'
                  ? 'bg-accentsoft text-accentink shadow-sm'
                  : 'text-inksoft hover:bg-surface2 hover:text-ink'
              }`}
            >
              <SettingIcon />
              <span>Pengaturan</span>
            </Link>
          </nav>
        </aside>

        {/* MAIN CONTENT — scroll sendiri */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 lg:p-8 pb-8">
            <Routes>
              <Route path="/" element={<Dashboard dark={dark} />} />
              <Route path="/aset" element={<Aset />} />
              {/* Backward-compatible routes mapped to Aset */}
              <Route path="/input" element={<Aset />} />
              <Route path="/laporan" element={<Aset />} />
              <Route path="/cash" element={<Cash />} />
              <Route path="/arus-kas" element={<ArusKas />} />
              <Route path="/laporan-keuangan" element={<Laporan />} />
              <Route path="/target" element={<Target />} />
              <Route path="/pengaturan" element={<Pengaturan dark={dark} onToggleTheme={onToggleTheme} onOpenPassword={() => setPwOpen(true)} onLogout={onLogout} />} />
              <Route path="/hutang-piutang" element={<HutangPiutang />} />
            </Routes>
          </div>

          {/* FOOTER (ikut scroll konten) */}
          <footer className="bg-surface border-t border-line">
            <div className="px-4 lg:px-6 py-6 lg:py-8 text-center text-inkfaint text-xs lg:text-sm">
              <p>© 2025 Finance Monitor · Elegant Financial Management</p>
            </div>
          </footer>
        </main>
      </div>

      {/* Modal Ganti Password */}
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  )
}

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Terapkan tema ke <html> dan simpan preferensi
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggleTheme = () => setDark(d => !d)

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
      <AppContent onLogout={handleLogout} dark={dark} onToggleTheme={toggleTheme} />
    </Router>
  )
}

export default App
