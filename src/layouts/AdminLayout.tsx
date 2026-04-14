import { useState, useEffect, useRef } from 'react'
import type { AdminNavItem } from '../lib/admin-site-config-db'

const THEME_KEY = 'theme'
const HUE_KEY = 'themeHue'
const DEFAULT_HUE = 250

interface AdminLayoutProps {
  title: string
  siteName: string
  navItems: AdminNavItem[]
  children: React.ReactNode
}

export default function AdminLayout({ title, siteName, navItems, children }: AdminLayoutProps) {
  const [pathname, setPathname] = useState('')
  const [hue, setHue] = useState(DEFAULT_HUE)
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setPathname(window.location.pathname)
    const h = localStorage.getItem(HUE_KEY)
    if (h !== null) {
      const n = parseInt(h, 10)
      if (!isNaN(n) && n >= 0 && n <= 360) setHue(n)
    }
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--hue', String(hue))
  }, [hue])

  useEffect(() => {
    if (!themeOpen) return
    const close = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [themeOpen])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      window.location.href = '/admin/login'
    } catch {
      setLoggingOut(false)
    }
  }

  const toggleDark = () => {
    const html = document.documentElement
    html.classList.toggle('dark')
    localStorage.setItem(THEME_KEY, html.classList.contains('dark') ? 'dark' : 'light')
  }

  const applyHue = (h: number) => {
    if (h >= 0 && h <= 360) {
      setHue(h)
      localStorage.setItem(HUE_KEY, String(h))
    }
  }

  const resetHue = () => {
    setHue(DEFAULT_HUE)
    localStorage.removeItem(HUE_KEY)
    document.documentElement.style.removeProperty('--hue')
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
            <a href="/admin" className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
              管理
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
            <div className="relative" ref={themeRef}>
              <button
                type="button"
                onClick={() => setThemeOpen((o) => !o)}
                className="search-trigger px-2.5 py-1.5 rounded border transition-colors hover:bg-(--card-border)"
                style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
                aria-label="主题色"
                aria-expanded={themeOpen}
              >
                --hue
              </button>
              {themeOpen ? (
                <div
                  className="absolute right-0 top-full mt-2 w-64 section-card p-4 z-50"
                  role="dialog"
                  aria-label="主题色设置"
                  style={{ borderRadius: 'var(--radius)', border: '1px solid var(--card-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="code-label">$ theme --hue</span>
                    <button type="button" onClick={resetHue} className="p-1.5 rounded-lg transition-opacity hover:opacity-80" style={{ background: 'var(--card-border)', color: 'var(--accent)' }} aria-label="重置">
                      ↺
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={hue}
                      onChange={(e) => applyHue(Number(e.target.value))}
                      className="flex-1 h-3 rounded-full appearance-none cursor-pointer theme-hue-slider"
                      style={{ background: 'linear-gradient(to right,red,yellow,lime,cyan,blue,magenta,red)' }}
                    />
                    <output className="shrink-0 min-w-12 h-7 px-2 rounded-lg flex items-center justify-center font-mono text-sm" style={{ background: 'var(--card-border)', color: 'var(--text)' }}>
                      {hue}
                    </output>
                  </div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={toggleDark}
              className="search-trigger px-2.5 py-1.5 rounded border transition-colors hover:bg-(--card-border)"
              style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
              aria-label="切换暗色模式"
            >
              <span className="dark:hidden" aria-hidden>dark</span>
              <span className="hidden dark:inline" aria-hidden>light</span>
            </button>
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
