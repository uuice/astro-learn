import { createSignal, onMount, Show, For } from 'solid-js'
import { Portal } from 'solid-js/web'

type ContentData = {
  posts: { id: string; data: Record<string, unknown> }[]
  pages: { id: string; data: Record<string, unknown> }[]
  authors: { id: string; data: Record<string, unknown> }[]
}

type Tab = 'posts' | 'pages' | 'authors'

const TABS: { key: Tab; label: string }[] = [
  { key: 'posts', label: '文章' },
  { key: 'pages', label: '页面' },
  { key: 'authors', label: '作者' },
]

export default function ContentDataAdmin() {
  const [data, setData] = createSignal<ContentData>({ posts: [], pages: [], authors: [] })
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [tab, setTab] = createSignal<Tab>('posts')
  const [detail, setDetail] = createSignal<{ id: string; data: Record<string, unknown> } | null>(null)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content')
      if (!res.ok) throw new Error('加载失败')
      const json = (await res.json()) as ContentData
      setData(json)
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    void load()
  })

  const getColumns = (currentTab: Tab) =>
    currentTab === 'posts' ? ['title', 'url', 'published'] : currentTab === 'pages' ? ['title', 'alias', 'url'] : ['title', 'url']
  const list = () => data()[tab()]
  const columns = () => getColumns(tab())

  return (
    <div class="content-data-admin">
      <div class="content-admin-tabs" style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
        <For each={TABS}>{({ key, label }) => (
          <button
            type="button"
            class={`content-admin-tab${tab() === key ? ' content-admin-tab-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label} ({data()[key].length})
          </button>
        )}</For>
        <button
          type="button"
          class="comment-submit"
          onClick={() => void load()}
          disabled={loading()}
          style="margin-left:auto;"
        >
          {loading() ? '加载中...' : '刷新'}
        </button>
      </div>
      <Show when={loading()}>
        <p class="content-admin-muted">加载中...</p>
      </Show>
      <Show when={!loading() && !!error()}>
        <p class="content-admin-error">{error()}</p>
      </Show>
      <Show when={!loading() && !error()}>
        <div class="content-admin-table-wrap">
          <table class="content-admin-table">
            <thead>
              <tr>
                <th>id</th>
                <For each={columns()}>{(col) => <th>{col}</th>}</For>
                <th style="width:80px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <For each={list()}>{(row) => (
                <tr onClick={() => setDetail(row)} class="content-admin-row">
                  <td class="content-admin-id">{row.id}</td>
                  <For each={columns()}>{(col) => <td>{(row.data as Record<string, unknown>)[col]?.toString() ?? '-'}</td>}</For>
                  <td class="content-admin-detail-btn">详情</td>
                </tr>
              )}</For>
            </tbody>
          </table>
        </div>
        <Show when={detail()}>
          {(item) => (
            <Portal>
              <div class="content-admin-modal-overlay" onClick={() => setDetail(null)} role="presentation">
                <div class="content-admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                  <div class="content-admin-modal-header">
                    <span>详情</span>
                    <button type="button" class="content-admin-modal-close" onClick={() => setDetail(null)}>
                      关闭
                    </button>
                  </div>
                  <pre class="content-admin-modal-body">{JSON.stringify(item(), null, 2)}</pre>
                </div>
              </div>
            </Portal>
          )}
        </Show>
      </Show>
    </div>
  )
}
