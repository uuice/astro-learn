import { useState, useEffect, useRef } from 'react'

const TOKEN_KEY = 'comment_admin_token'
const THEME_KEY = 'theme'
const HUE_KEY = 'themeHue'
const DEFAULT_HUE = 250

export interface AdminNavItem {
  title: string
  url: string
}

interface AdminLayoutProps {
  title: string
  siteName: string
  navItems: AdminNavItem[]
  children: React.ReactNode
}

export default function AdminLayout({ title, siteName, navItems, children }: AdminLayoutProps) {
  const [token, setToken] = useState('')
  const [tokenHint, setTokenHint] = useState('')
  const [pathname, setPathname] = useState(typeof window !== 'undefined' ? window.location.pathname : '')
  const [hue, setHue] = useState(DEFAULT_HUE)
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)
  const [hasToken, setHasToken] = useState<boolean | null>(null)
  const [setupToken, setSetupToken] = useState('')
  const [setupError, setSetupError] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((d: { hasToken?: boolean }) => setHasToken(!!d.hasToken))
      .catch(() => setHasToken(true))
  }, [])

  useEffect(() => {
    setPathname(window.location.pathname)
    try {
      setToken(sessionStorage.getItem(TOKEN_KEY) || '')
    } catch {}
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

  const saveToken = () => {
    const v = token.trim()
    try {
      sessionStorage.setItem(TOKEN_KEY, v)
    } catch {}
    setTokenHint(v ? '已保存' : '已清除')
    setTimeout(() => setTokenHint(''), 1500)
    window.dispatchEvent(new CustomEvent('admin-token-saved'))
  }

  const doSetup = () => {
    const v = setupToken.trim()
    if (!v) {
      setSetupError('请输入 Token')
      return
    }
    setSetupError('')
    setSetupLoading(true)
    fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: v }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setSetupError(d.error)
          return
        }
        try {
          sessionStorage.setItem(TOKEN_KEY, v)
        } catch {}
        setToken(v)
        setHasToken(true)
        setTokenHint('已设置')
        window.dispatchEvent(new CustomEvent('admin-token-saved'))
        setTimeout(() => setTokenHint(''), 1500)
      })
      .catch(() => setSetupError('设置失败'))
      .finally(() => setSetupLoading(false))
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
    <div className="min-h-screen flex flex-col">
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
          <nav className="flex items-center gap-4" aria-label="管理导航">
            {navItems.map((item) => (
              <a
                key={item.url}
                href={item.url}
                className={`admin-nav-link${pathname.startsWith(item.url) ? ' admin-nav-active' : ''}`}
                style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}
              >
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
          </div>
        </div>
        <div
          className="admin-token-bar border-t px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 flex-wrap"
          style={{ borderColor: 'var(--border)', background: 'var(--page-bg)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
        >
          {hasToken === null ? (
            <span style={{ color: 'var(--text-muted)' }}>加载中...</span>
          ) : !hasToken ? (
            <>
              <label htmlFor="admin-setup-input" style={{ color: 'var(--text-muted)' }}>
                首次设置 Token
              </label>
              <input
                id="admin-setup-input"
                type="password"
                value={setupToken}
                onChange={(e) => { setSetupToken(e.target.value); setSetupError('') }}
                placeholder="设置管理 Token"
                className="admin-token-input"
                style={{ flex: 1, minWidth: '12rem', maxWidth: '20rem', padding: '0.35rem 0.6rem', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={doSetup}
                disabled={setupLoading}
                className="admin-token-save"
                style={{ padding: '0.35rem 0.65rem', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', background: 'var(--card-bg)', color: 'var(--accent)', cursor: 'pointer' }}
              >
                {setupLoading ? '设置中...' : '设置'}
              </button>
              {setupError ? <span style={{ color: 'var(--accent)' }}>{setupError}</span> : null}
            </>
          ) : (
            <>
              <label htmlFor="admin-token-input" style={{ color: 'var(--text-muted)' }}>
                Token
              </label>
              <input
                id="admin-token-input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ADMIN_TOKEN"
                className="admin-token-input"
                style={{ flex: 1, minWidth: '12rem', maxWidth: '20rem', padding: '0.35rem 0.6rem', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={saveToken}
                className="admin-token-save"
                style={{ padding: '0.35rem 0.65rem', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)', background: 'var(--card-bg)', color: 'var(--accent)', cursor: 'pointer' }}
              >
                保存
              </button>
              {tokenHint ? <span style={{ color: 'var(--text-muted)' }}>{tokenHint}</span> : null}
            </>
          )}
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
