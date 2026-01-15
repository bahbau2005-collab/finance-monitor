import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { healthCheck } from './services/api'

// Pages
import Dashboard from './pages/Dashboard'
import Aset from './pages/Aset'
import Cash from './pages/Cash'
import HutangPiutang from './pages/HutangPiutang'

function AppContent() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg sticky top-0 z-50">
        <div className="px-4 lg:px-6 py-4 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Finance Monitor</h1>
              <p className="text-blue-100 text-xs lg:text-sm mt-1">Personal Finance Management System</p>
            </div>
            {/* Hamburger Menu untuk Mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden ml-4 p-2 hover:bg-blue-500 rounded-lg transition-colors"
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
        <aside className={`fixed lg:sticky left-0 top-20 w-64 bg-white/80 backdrop-blur-md shadow-xl h-[calc(100vh-80px)] overflow-y-auto border-r border-blue-100 transition-transform duration-300 z-30 flex-shrink-0 pb-2 ${
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Cash</span>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Hutang & Piutang</span>
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
            <Route path="/hutang-piutang" element={<HutangPiutang />} />
          </Routes>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-blue-100">
        <div className="px-4 lg:px-6 py-6 lg:py-8 text-center text-gray-600 text-xs lg:text-sm">
          <p>© 2025 Finance Monitor. Personal Financial Management System.</p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check backend connection saat App mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await healthCheck()
        setIsConnected(true)
      } catch (error) {
        console.error('Backend connection failed:', error)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

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

  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
