import {
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
  Show,
  For,
} from 'solid-js'
import type { SearchDoc } from '../../scripts/search.ts'

// eslint-disable-next-line no-unused-vars -- search runner arity
type SearchRunner = (term: string, limit: number) => SearchDoc[]

interface Props {
  baseUrl: string
}

function makeSimpleSearch(docs: SearchDoc[]) {
  return (q: string, limit: number) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return docs
      .filter((d) => {
        const text = [
          d.title || '',
          d.excerpt || '',
          d.body || '',
          (d.categories || []).join(' '),
          (d.tags || []).join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return words.every((w) => text.includes(w))
      })
      .slice(0, limit || 15)
  }
}

export default function BlogSearch({ baseUrl }: Props) {
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal('')
  const [docs, setDocs] = createSignal<SearchDoc[] | null>(null)
  const [runSearch, setRunSearch] = createSignal<SearchRunner | null>(null)
  let inputRef: HTMLInputElement | undefined
  let loadStarted = false

  const indexUrl = createMemo(() => {
    const b = (baseUrl || '/').replace(/\/?$/, '') || '/'
    // 不能写成 `${b}/search-index.json`：当 b 为 '/' 时会得到 '//search-index.json'，
    // 浏览器会把它当成协议相对 URL（主机名 search-index.json），而不是根路径下的文件。
    return b === '/' ? '/search-index.json' : `${b}/search-index.json`
  })

  const loadIndex = () => {
    if (loadStarted) return
    loadStarted = true
    void (async () => {
      try {
        const res = await fetch(indexUrl())
        if (!res.ok) throw new Error('fetch failed')
        const loaded = (await res.json()) as SearchDoc[]
        setDocs(loaded)
        try {
          const { createSearchIndex, search } =
            await import('../../scripts/search.ts')
          const idx = createSearchIndex(loaded)
          setRunSearch(
            () => (term: string, limit: number) =>
              search(idx, loaded, term, limit),
          )
        } catch {
          setRunSearch(() => makeSimpleSearch(loaded))
        }
      } catch {
        setDocs([])
        setRunSearch(() => () => [])
      }
    })()
  }

  const close = () => {
    setOpen(false)
  }

  const openPanel = () => {
    setOpen(true)
    setQuery('')
    loadIndex()
  }

  createEffect(() => {
    if (!open()) return
    inputRef?.focus()
  })

  createEffect(() => {
    if (!open()) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    onCleanup(() => window.removeEventListener('keydown', onKey))
  })

  const term = createMemo(() => query().trim())
  const matched = createMemo((): SearchDoc[] | undefined => {
    const currentTerm = term()
    const currentDocs = docs()
    const runner = runSearch()
    if (!currentTerm) return undefined
    if (!runner || currentDocs === null) return undefined
    return runner(currentTerm, 15)
  })

  const showEmptyHint = createMemo(() => !term())
  const showNoMatch = createMemo(() =>
    Boolean(term() && matched() && matched()!.length === 0),
  )
  const showList = createMemo(() => Boolean(matched() && matched()!.length > 0))

  return (
    <>
      <button
        type="button"
        class="search-trigger inline-flex items-center justify-center min-h-9 min-w-9 shrink-0 rounded-md border px-1.5 py-1.5 transition-colors hover:bg-(--card-border)"
        style="border-color:var(--card-border);background:var(--card-bg);color:var(--text-muted);"
        aria-label="搜索"
        title="搜索"
        onClick={openPanel}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      <div
        class={`fixed inset-0 z-50 search-overlay-terminal${open() ? ' open' : ''}`}
        aria-hidden={!open()}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div
          class="search-panel-terminal search-panel-cute"
          role="dialog"
          aria-label="搜索文章"
        >
          <span class="search-panel-cute-glyph" aria-hidden="true">
            ✦ find · ✧
          </span>
          <div class="search-panel-header flex items-start justify-between gap-2">
            <div>
              <h2 class="search-panel-title">搜索</h2>
              <p class="code-label mt-1 mb-2">输入关键词后按回车打开结果</p>
            </div>
            <button
              type="button"
              class="search-trigger inline-flex items-center justify-center min-h-8 min-w-8 shrink-0 rounded-md border p-1 transition-colors hover:bg-(--card-border)"
              style="border-color:var(--card-border);background:var(--card-bg);color:var(--text-muted);"
              aria-label="关闭"
              title="关闭"
              onClick={close}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div class="search-panel-input-wrap">
            <input
              ref={inputRef}
              type="search"
              autocomplete="off"
              placeholder="输入关键词"
              class="search-panel-input"
              style="font-family:var(--font-mono);font-size:var(--text-sm);background:transparent;color:var(--text);border:none;outline:none;flex:1;"
              value={query()}
              onChange={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') close()
              }}
            />
          </div>
          <div class="search-results-terminal">
            <Show when={showEmptyHint()}>
              <p class="code-label py-4">请输入关键词</p>
            </Show>
            <Show when={showNoMatch()}>
              <p class="code-label py-4">无匹配结果</p>
            </Show>
            <Show when={showList() && matched()}>
              <ul class="post-list terminal-list">
                <For each={matched()}>
                  {(item) => {
                    const categoryStr =
                      item.categories && item.categories.length
                        ? ` · 分类：${item.categories.join(', ')}`
                        : ''
                    const desc = (
                      item.excerpt ||
                      (item.body
                        ? item.body.slice(0, 100) +
                          (item.body.length > 100 ? '…' : '')
                        : '')
                    ).trim()
                    return (
                      <li>
                        <article
                          class="post-card-cute section-card group"
                          style="border-left:none;border-radius:0;box-shadow:none;margin:0;border-bottom:${isLast ? 'none' : '1px solid var(--card-border)'};padding:0.5rem 0.75rem;"
                        >
                          <a
                            href={item.url}
                            class="terminal-meta-line block transition-colors hover:text-(--accent)"
                            onClick={() => close()}
                          >
                            <span class="font-medium">{item.title || ''}</span>
                            <span class="meta-from">{categoryStr}</span>
                            {desc ? (
                              <span class="meta-desc"> {desc}</span>
                            ) : null}
                          </a>
                        </article>
                      </li>
                    )
                  }}
                </For>
              </ul>
            </Show>
          </div>
        </div>
      </div>
    </>
  )
}
