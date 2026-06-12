function Pengaturan({ dark, onToggleTheme, onOpenPassword, onLogout }) {
  return (
    <div className="space-y-6 lg:space-y-8 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-ink mb-2">Pengaturan</h1>
        <p className="text-xs lg:text-sm text-inksoft">Atur tampilan dan akun Anda</p>
      </div>

      {/* TAMPILAN */}
      <div className="card">
        <h3 className="text-base lg:text-lg font-semibold text-ink mb-4">Tampilan</h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex w-10 h-10 rounded-xl bg-accentsoft text-accentink items-center justify-center">
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>
              )}
            </span>
            <div>
              <p className="font-medium text-ink">Mode Gelap</p>
              <p className="text-xs text-inkfaint">{dark ? 'Sedang aktif' : 'Nonaktif'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            role="switch"
            aria-checked={dark}
            aria-label="Toggle mode gelap"
            className="relative w-14 h-8 rounded-full transition-colors flex-shrink-0"
            style={{ background: dark ? 'var(--accent)' : 'var(--line-strong)' }}
          >
            <span
              className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
              style={{ left: dark ? '1.75rem' : '0.25rem' }}
            ></span>
          </button>
        </div>
      </div>

      {/* AKUN */}
      <div className="card">
        <h3 className="text-base lg:text-lg font-semibold text-ink mb-4">Akun</h3>
        <div className="space-y-3">
          <button
            type="button"
            onClick={onOpenPassword}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-line hover:bg-surface2 transition-colors text-left"
          >
            <span className="flex items-center gap-3">
              <span className="flex w-9 h-9 rounded-lg bg-surface2 text-inksoft items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM7 11a5 5 0 00-5 5v1h10M16 11l5 5m0-5l-5 5" /></svg>
              </span>
              <span className="font-medium text-ink">Ganti Password</span>
            </span>
            <svg className="w-5 h-5 text-inkfaint" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-line hover:bg-surface2 transition-colors text-left"
          >
            <span className="flex items-center gap-3">
              <span className="flex w-9 h-9 rounded-lg items-center justify-center" style={{ background: 'var(--surface-2)', color: 'var(--down)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4M21 3v18" /></svg>
              </span>
              <span className="font-medium" style={{ color: 'var(--down)' }}>Keluar</span>
            </span>
            <svg className="w-5 h-5 text-inkfaint" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-inkfaint">Finance Monitor · v1.0</p>
    </div>
  )
}

export default Pengaturan
