import { createSignal, onMount, onCleanup, type JSX } from 'solid-js'
import type { AdminNavItem } from '../lib/admin-site-config-db'

interface AdminLayoutProps {
  siteName: string
  navItems: AdminNavItem[]
  controls?: JSX.Element
  children: JSX.Element
}

export default function AdminLayout({ siteName, navItems, controls, children }: AdminLayoutProps) {
  const [pathname, setPathname] = createSignal('')
  const [loggingOut, setLoggingOut] = createSignal(false)

  onMount(() => {
    setPathname(window.location.pathname)
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    onCleanup(() => window.removeEventListener('popstate', onPopState))
  })

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
    <div class="relative z-1 min-h-screen flex flex-col">
      <header class="sticky top-0 z-30 flex flex-col border-b" style="background:var(--header-bg);border-color:var(--border);">
        <div class="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <a href="/" class="font-semibold transition-opacity hover:opacity-80 flex items-center gap-1.5" style={{ color: 'var(--text)', 'font-size': 'var(--text-sm)', 'font-family': 'var(--font-mono)' }}>
              <span class="code-label">$</span> {siteName}
            </a>
            <span style={{ color: 'var(--text-muted)', 'font-size': 'var(--text-xs)' }}>/</span>
            <a href="/admin" class="font-medium transition-opacity hover:opacity-80 inline-flex items-center gap-1" style={{ color: 'var(--text-muted)', 'font-size': 'var(--text-sm)', 'font-family': 'var(--font-mono)' }}>
              管理
              <span class="admin-header-cute select-none" aria-hidden="true">✨</span>
            </a>
          </div>
          <nav class="hidden lg:flex items-center gap-5" aria-label="管理导航">
            {navItems.map((item) => (
              <a
                href={item.url}
                class={`nav-link-cute py-1 flex items-center gap-1.5${pathname().startsWith(item.url) ? ' admin-nav-active' : ''}`}
                style={{ color: 'var(--text-muted)', 'font-size': 'var(--text-xs)', 'font-family': 'var(--font-mono)' }}
              >
                <span class="nav-symbol" style={{ color: 'var(--accent)' }}>›</span>
                {item.title}
              </a>
            ))}
          </nav>
          <div class="flex items-center gap-2 ml-auto">
            {controls}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut()}
              class="search-trigger px-2.5 py-1.5 rounded border transition-colors hover:bg-(--card-border)"
              style={{ 'border-color': 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--accent)', 'font-family': 'var(--font-mono)', 'font-size': 'var(--text-sm)' }}
              aria-label="登出"
            >
              {loggingOut() ? '...' : '登出'}
            </button>
          </div>
        </div>
        <div class="lg:hidden border-t px-4 sm:px-6 py-2.5 overflow-x-auto" style={{ 'border-color': 'var(--border)' }}>
          <nav class="flex gap-5 min-w-max pb-1" aria-label="管理导航">
            {navItems.map((item) => (
              <a
                href={item.url}
                class={`nav-link-cute whitespace-nowrap py-1 flex items-center gap-1.5${pathname().startsWith(item.url) ? ' admin-nav-active' : ''}`}
                style={{ color: 'var(--text-muted)', 'font-size': 'var(--text-xs)', 'font-family': 'var(--font-mono)' }}
              >
                <span class="nav-symbol" style={{ color: 'var(--accent)' }}>›</span>
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div class="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex-1">
        <main class="page-main">{children}</main>
      </div>

      <footer class="py-6 mt-auto border-t" style={{ background: 'var(--footer-bg)', 'border-color': 'var(--border)' }}>
        <div class="max-w-5xl mx-auto px-4 sm:px-6" style={{ 'font-family': 'var(--font-mono)', 'font-size': 'var(--text-xs)', color: 'var(--text-muted)' }}>
          <p class="m-0">
            <a href="/" class="transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
              ← 返回站点
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
