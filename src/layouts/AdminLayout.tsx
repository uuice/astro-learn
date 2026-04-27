import { useState, useEffect } from 'react'
import type { AdminNavItem } from '../lib/admin-site-config-db'

interface AdminLayoutProps {
  siteName: string
  navItems: AdminNavItem[]
  controls?: React.ReactNode
  children: React.ReactNode
}

export default function AdminLayout({ siteName, navItems, controls, children }: AdminLayoutProps) {
  const [pathname, setPathname] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setPathname(window.location.pathname)
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      window.location.href = '/admin/login'
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div className="relative z-[1] min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 flex flex-col border-b" style={{ background: 'var(--header-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <a href="/" className="font-semibold transition-opacity hover:opacity-80 flex items-center gap-1.5" style={{ color: 'var(--text)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
              <span className="code-label">$</span> {siteName}
            </a>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>/</span>
            <a href="/admin" className="font-medium transition-opacity hover:opacity-80 inline-flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
              管理
              <span className="admin-header-cute select-none" aria-hidden="true">✨</span>
            </a>
          </div>
          <nav className="hidden lg:flex items-center gap-5" aria-label="管理导航">
            {navItems.map((item) => (
              <a
                key={item.url}
                href={item.url}
                className={`nav-link-cute py-1 flex items-center gap-1.5${pathname.startsWith(item.url) ? ' admin-nav-active' : ''}`}
                style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
              >
                <span className="nav-symbol" style={{ color: 'var(--accent)' }}>›</span>
                {item.title}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            {controls}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="search-trigger px-2.5 py-1.5 rounded border transition-colors hover:bg-(--card-border)"
              style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
              aria-label="登出"
            >
              {loggingOut ? '...' : '登出'}
            </button>
          </div>
        </div>
        <div className="lg:hidden border-t px-4 sm:px-6 py-2.5 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          <nav className="flex gap-5 min-w-max pb-1" aria-label="管理导航">
            {navItems.map((item) => (
              <a
                key={item.url}
                href={item.url}
                className={`nav-link-cute whitespace-nowrap py-1 flex items-center gap-1.5${pathname.startsWith(item.url) ? ' admin-nav-active' : ''}`}
                style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
              >
                <span className="nav-symbol" style={{ color: 'var(--accent)' }}>›</span>
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex-1">
        <main className="page-main">{children}</main>
      </div>

      <footer className="py-6 mt-auto border-t" style={{ background: 'var(--footer-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <p className="m-0">
            <a href="/" className="transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
              ← 返回站点
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
