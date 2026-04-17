import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SearchDoc } from '../../scripts/search.ts'

// eslint-disable-next-line no-unused-vars -- search runner arity
type SearchRunner = (term: string, limit: number) => SearchDoc[]

interface Props {
  baseUrl: string
}

function slugFromTitle(t: string) {
  return (t || '').replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').toLowerCase() || 'post'
}

function makeSimpleSearch(docs: SearchDoc[]) {
  return (q: string, limit: number) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return docs
      .filter((d) => {
        const text = [d.title || '', d.excerpt || '', d.body || '', (d.categories || []).join(' '), (d.tags || []).join(' ')].join(' ').toLowerCase()
        return words.every((w) => text.includes(w))
      })
      .slice(0, limit || 15)
  }
}

export default function BlogSearch({ baseUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const [runSearch, setRunSearch] = useState<SearchRunner | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const loadStarted = useRef(false)

  const indexUrl = useMemo(() => {
    const b = (baseUrl || '/').replace(/\/?$/, '') || '/'
    // 不能写成 `${b}/search-index.json`：当 b 为 '/' 时会得到 '//search-index.json'，
    // 浏览器会把它当成协议相对 URL（主机名 search-index.json），而不是根路径下的文件。
    return b === '/' ? '/search-index.json' : `${b}/search-index.json`
  }, [baseUrl])

  const loadIndex = useCallback(() => {
    if (loadStarted.current) return
    loadStarted.current = true
    void (async () => {
      try {
        const res = await fetch(indexUrl)
        if (!res.ok) throw new Error('fetch failed')
        const loaded = (await res.json()) as SearchDoc[]
        setDocs(loaded)
        try {
          const { createSearchIndex, search } = await import('../../scripts/search.ts')
          const idx = createSearchIndex(loaded)
          setRunSearch(() => (term: string, limit: number) => search(idx, loaded, term, limit))
        } catch {
          setRunSearch(() => makeSimpleSearch(loaded))
        }
      } catch {
        setDocs([])
        setRunSearch(() => () => [])
      }
    })()
  }, [indexUrl])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const openPanel = useCallback(() => {
    setOpen(true)
    setQuery('')
    loadIndex()
  }, [loadIndex])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const term = query.trim()
  const matched = useMemo((): SearchDoc[] | undefined => {
    if (!term) return undefined
    if (!runSearch || docs === null) return undefined
    return runSearch(term, 15)
  }, [term, runSearch, docs])

  const showEmptyHint = !term
  const showNoMatch = Boolean(term && matched && matched.length === 0)
  const showList = Boolean(matched && matched.length > 0)

  return (
    <>
      <button
        type="button"
        className="search-trigger inline-flex items-center justify-center min-h-9 min-w-9 shrink-0 rounded-md border px-1.5 py-1.5 transition-colors hover:bg-(--card-border)"
        style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-muted)' }}
        aria-label="搜索"
        title="搜索"
        onClick={openPanel}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-50 search-overlay-terminal${open ? ' open' : ''}`}
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div className="search-panel-terminal search-panel-cute" role="dialog" aria-label="搜索文章">
          <span className="search-panel-cute-glyph" aria-hidden="true">
            ✦ find · ✧
          </span>
          <div className="search-panel-header flex items-start justify-between gap-2">
            <div>
              <p className="code-label mb-0.5">
                <span className="sym sym-prompt">$</span> pwd:
              </p>
              <p className="code-label mb-0.5">
                <span className="sym sym-keyword">search</span> <span className="sym sym-flag">--list</span>
              </p>
              <p className="code-label mb-2">
                <span className="sym sym-info">ready</span>
              </p>
              <h2 className="search-panel-title">
                <span className="sym sym-hash">#</span> &gt; 搜索
              </h2>
              <p className="code-label mt-1 mb-2">输入内容筛选，或按 ⏎ 打开。⇧ + ⏎ 换行</p>
            </div>
            <button
              type="button"
              className="search-trigger inline-flex items-center justify-center min-h-8 min-w-8 shrink-0 rounded-md border p-1 transition-colors hover:bg-(--card-border)"
              style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-muted)' }}
              aria-label="关闭"
              title="关闭"
              onClick={close}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="search-panel-input-wrap">
            <span className="code-label mr-2">
              <span className="sym sym-keyword">search</span> <span className="sym sym-flag">--ai</span>
            </span>
            <input
              ref={inputRef}
              type="search"
              autoComplete="off"
              placeholder=""
              className="search-panel-input"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                background: 'transparent',
                color: 'var(--text)',
                border: 'none',
                outline: 'none',
                flex: 1,
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') close()
              }}
            />
          </div>
          <p className="code-label mt-1 mb-2">
            <span className="sym sym-prompt">$</span> find
          </p>
          <div className="search-results-terminal">
            {showEmptyHint && <p className="code-label py-4">输入关键词筛选</p>}
            {showNoMatch && <p className="code-label py-4">无匹配结果</p>}
            {showList && matched && (
              <ul className="post-list terminal-list">
                {matched.map((item, i, arr) => {
                  const slug = slugFromTitle(item.title)
                  const fromStr =
                    item.categories && item.categories.length ? ` from "${item.categories.join(', ')}"` : ''
                  const desc = (item.excerpt || (item.body ? item.body.slice(0, 100) + (item.body.length > 100 ? '…' : '') : '')).trim()
                  const isLast = i === arr.length - 1
                  return (
                    <li key={item.id || item.url}>
                      <article
                        className="post-card-cute section-card group"
                        style={{
                          borderLeft: 'none',
                          borderRadius: 0,
                          boxShadow: 'none',
                          margin: 0,
                          borderBottom: isLast ? 'none' : '1px solid var(--card-border)',
                          padding: '0.5rem 0.75rem',
                        }}
                      >
                        <div className="terminal-export-line">
                          <span className="sym sym-export-hash">###</span> <span className="sym sym-keyword">export</span>{' '}
                          <span className="export-name">{slug}</span>
                        </div>
                        <a
                          href={item.url}
                          className="terminal-meta-line block transition-colors hover:text-(--accent)"
                          onClick={() => close()}
                        >
                          <span className="font-medium">{item.title || ''}</span>
                          <span className="meta-from">{fromStr}</span>
                          {desc ? <span className="meta-desc"> {desc}</span> : null}
                        </a>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
